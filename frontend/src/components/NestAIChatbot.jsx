import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Bot,
  ExternalLink,
  MessageSquare,
  Minus,
  RotateCcw,
  Send,
  Sparkles,
  X,
  FileText,
  Bookmark
} from "lucide-react";
import { chatService } from "../services/chatService.js";
import PaperModal from "./PaperModal.jsx";
import { isPaperSaved, toggleSavedPaper } from "../services/savedPapersStore.js";
import "../styles/chatbot.css";

const DEFAULT_QUICK_PROMPTS = [
  "How does the hybrid recommendation model work?",
  "Recommend papers on State Space Models & Mamba",
  "How does the active reading timer boost recommendations?",
  "Tell me about GraphCast weather forecasting",
  "How do research stacks and saved papers work?",
];

function FormattedContent({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let currentList = [];

  function flushList() {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="nestai-formatted-list">
          {currentList.map((li, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(li) }} />
          ))}
        </ul>
      );
      currentList = [];
    }
  }

  function formatInline(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code class='nestai-inline-code'>$1</code>");
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^### /, "")) }} />
      );
    } else if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.replace(/^[•\-\*]\s*/, "");
      currentList.push(itemText);
    } else if (trimmed.startsWith(">")) {
      flushList();
      elements.push(
        <blockquote key={`quote-${i}`} dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^>\s*/, "")) }} />
      );
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
      );
    }
  });

  flushList();
  return <div className="nestai-formatted-wrap">{elements}</div>;
}

export default function NestAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => chatService.getStoredHistory());
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedModalPaper, setSelectedModalPaper] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState("overview");

  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatService.saveHistory(messages);
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isThinking) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput("");
    setIsThinking(true);

    try {
      const response = await chatService.sendMessage(query, newHistory);
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply,
        intent: response.intent,
        suggestedQueries: response.suggestedQueries || [],
        relatedPapers: response.relatedPapers || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "I apologize, I encountered an issue analyzing the literature vector space. Please try again or ask another question.",
          suggestedQueries: DEFAULT_QUICK_PROMPTS.slice(0, 3),
          relatedPapers: [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearChat = () => {
    chatService.clearHistory();
    setMessages([]);
  };

  const handleOpenPaperModal = (paper, tab = "overview") => {
    setModalInitialTab(tab);
    setSelectedModalPaper(paper);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          id="nestai-copilot-launcher"
          className="nestai-launcher-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open NestAI Research Copilot"
        >
          <div className="nestai-launcher-icon-wrap">
            <Sparkles size={18} />
            <span className="nestai-launcher-pulse" />
          </div>
          <span>Ask NestAI</span>
        </button>
      )}

      {/* Floating Chatbot Window */}
      {isOpen && (
        <aside className="nestai-window" id="nestai-chat-window" aria-label="NestAI Copilot Dialog">
          {/* Header */}
          <div className="nestai-header">
            <div className="nestai-header-left">
              <div className="nestai-avatar">
                <Bot size={20} />
                <span className="nestai-avatar-online" />
              </div>
              <div className="nestai-title-wrap">
                <div className="nestai-title-row">
                  <h2 className="nestai-title">NestAI Copilot</h2>
                  <span className="nestai-badge">AI Assistant</span>
                </div>
                <span className="nestai-subtitle">Vector RAG · Catalog Grounded</span>
              </div>
            </div>

            <div className="nestai-header-actions">
              <button
                type="button"
                className="nestai-icon-btn"
                title="Reset conversation"
                onClick={handleClearChat}
                aria-label="Reset conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="nestai-icon-btn"
                title="Minimize chatbot"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize chatbot"
              >
                <Minus size={18} />
              </button>
            </div>
          </div>

          {/* Body / Message Stream */}
          <div className="nestai-body" ref={bodyRef}>
            {messages.length === 0 && (
              <div className="nestai-welcome-box">
                <div className="nestai-welcome-header">
                  <Sparkles size={18} />
                  <span>Scholarly Research Copilot</span>
                </div>
                <p className="nestai-welcome-text">
                  Welcome to <strong>ResearchNest</strong>! I can answer questions about scientific papers in our catalog, explain our hybrid AI recommendation algorithms, or help you organize your research stacks.
                </p>

                <div className="nestai-quick-prompts-title">Suggested questions to get started:</div>
                <div className="nestai-quick-prompts">
                  {DEFAULT_QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="nestai-prompt-pill"
                      onClick={() => handleSend(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`nestai-msg ${msg.role === "user" ? "nestai-msg-user" : "nestai-msg-assistant"}`}
              >
                {msg.role === "assistant" && (
                  <div className="nestai-msg-avatar">
                    <Bot size={15} />
                  </div>
                )}

                <div className="nestai-msg-content">
                  <div className={msg.role === "user" ? "nestai-user-bubble" : "nestai-assistant-bubble"}>
                    <FormattedContent content={msg.content} />

                    {/* Grounded Citation Paper Cards */}
                    {Array.isArray(msg.relatedPapers) && msg.relatedPapers.length > 0 && (
                      <div className="nestai-papers-wrap">
                        {msg.relatedPapers.map((paper, pIdx) => (
                          <div key={paper.id || pIdx} className="nestai-paper-card">
                            <div className="nestai-paper-meta-row">
                              <span className="nestai-field-tag">{paper.field || "Science"}</span>
                              <span className="nestai-paper-cites">
                                {(paper.citations || 0).toLocaleString()} citations
                              </span>
                            </div>
                            <div className="nestai-paper-title">{paper.title}</div>
                            <div className="nestai-paper-authors">
                              {paper.authors} {paper.year ? `(${paper.year})` : ""}
                            </div>

                            <div className="nestai-paper-actions">
                              <button
                                type="button"
                                className="nestai-paper-action-btn nestai-btn-primary"
                                onClick={() => handleOpenPaperModal(paper, "overview")}
                              >
                                <FileText size={12} />
                                <span>Preview</span>
                              </button>
                              <button
                                type="button"
                                className="nestai-paper-action-btn nestai-btn-ghost"
                                onClick={() => handleOpenPaperModal(paper, "reader")}
                              >
                                <BookOpen size={12} />
                                <span>Read Studio</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Follow-up suggestion pills */}
                  {Array.isArray(msg.suggestedQueries) && msg.suggestedQueries.length > 0 && (
                    <div className="nestai-suggestions">
                      {msg.suggestedQueries.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          className="nestai-suggestion-chip"
                          onClick={() => handleSend(sug)}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="nestai-msg nestai-msg-assistant">
                <div className="nestai-msg-avatar">
                  <Bot size={15} />
                </div>
                <div className="nestai-thinking">
                  <div className="nestai-dots">
                    <span className="nestai-dot" />
                    <span className="nestai-dot" />
                    <span className="nestai-dot" />
                  </div>
                  <span className="nestai-thinking-text">Synthesizing research catalog...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer / Input */}
          <div className="nestai-footer">
            <form
              className="nestai-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                ref={inputRef}
                id="nestai-chat-input"
                type="text"
                className="nestai-input"
                placeholder="Ask about papers, algorithms, or features..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isThinking}
              />
              <button
                type="submit"
                id="nestai-chat-send-btn"
                className="nestai-send-btn"
                disabled={!input.trim() || isThinking}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* Embedded Paper Modal when clicking paper preview in chat */}
      {selectedModalPaper && (
        <PaperModal
          paper={selectedModalPaper}
          onClose={() => setSelectedModalPaper(null)}
          isSaved={isPaperSaved(selectedModalPaper.id)}
          onToggleSave={() => toggleSavedPaper(selectedModalPaper)}
          onSelectPaper={(p) => setSelectedModalPaper(p)}
          initialTab={modalInitialTab}
        />
      )}
    </>
  );
}
