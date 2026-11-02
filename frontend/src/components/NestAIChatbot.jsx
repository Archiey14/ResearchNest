import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Bot,
  ExternalLink,
  MessageSquare,
  Mic,
  MicOff,
  Minus,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
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

export function cleanMarkdownForSpeech(text) {
  if (!text) return "";

  let cleaned = text;

  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, " ");

  // Remove markdown links [label](url) -> label
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove raw URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, "");

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Remove header markers (### Title -> Title)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");

  // Remove blockquote markers (> Quote -> Quote)
  cleaned = cleaned.replace(/^>\s+/gm, "");

  // Remove bullet points and numbered list markers
  cleaned = cleaned.replace(/^[\s]*[•\-\*+]\s+/gm, "");
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove bold, italic, strikethrough formatting
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, "$2");
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, "$2");
  cleaned = cleaned.replace(/~~(.*?)~~/g, "$1");

  // Remove inline code backticks
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

  // Remove horizontal rules
  cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, "");

  // Normalize spaces and trim
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

function getBestEnglishVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // English voices only
  const enVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
  if (enVoices.length === 0) return voices[0] || null;

  // Prioritize natural sounding / premium neural voices
  const preferred = enVoices.find((v) =>
    /(natural|google|premium|enhanced|neural|samantha|daniel|karen)/i.test(v.name)
  );

  return preferred || enVoices.find((v) => v.lang.toLowerCase() === "en-us") || enVoices[0];
}

export default function NestAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => chatService.getStoredHistory());
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [speechState, setSpeechState] = useState("idle"); // "idle" | "playing" | "paused"
  const [selectedModalPaper, setSelectedModalPaper] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState("overview");

  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseInputRef = useRef("");
  const activeUtteranceRef = useRef(null);

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

  // Initialize voices for speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
      return () => {
        if (window.speechSynthesis.onvoiceschanged === onVoicesChanged) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Clean up speech recognition and speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Stop recording and speech when chat window is minimized or closed
  useEffect(() => {
    if (!isOpen) {
      if (isRecording) {
        stopVoiceInput();
      }
      handleStopSpeech();
    }
  }, [isOpen, isRecording]);

  // Auto-dismiss voice error message after 6 seconds
  useEffect(() => {
    if (!voiceError) return;
    const timer = setTimeout(() => {
      setVoiceError(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [voiceError]);

  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setSpeakingMessageId(null);
    setSpeechState("idle");
    activeUtteranceRef.current = null;
  };

  const handlePauseSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.pause();
        setSpeechState("paused");
      } catch (err) {
        console.warn("Failed to pause speech:", err);
      }
    }
  };

  const handleResumeSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.resume();
        setSpeechState("playing");
      } catch (err) {
        console.warn("Failed to resume speech:", err);
      }
    }
  };

  const handleSpeak = (msg) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceError("Voice output (Text-to-Speech) is not supported in this browser.");
      return;
    }

    // If currently speaking this message and playing, pause it; if paused, resume it
    if (speakingMessageId === msg.id) {
      if (speechState === "playing") {
        handlePauseSpeech();
        return;
      }
      if (speechState === "paused") {
        handleResumeSpeech();
        return;
      }
    }

    // Stop previous speech when another response starts (or restarting current)
    handleStopSpeech();

    const textToSpeak = cleanMarkdownForSpeech(msg.content);
    if (!textToSpeak) return;

    try {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voice = getBestEnglishVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setSpeakingMessageId(msg.id);
        setSpeechState("playing");
      };

      utterance.onpause = () => {
        setSpeechState("paused");
      };

      utterance.onresume = () => {
        setSpeechState("playing");
      };

      utterance.onend = () => {
        setSpeakingMessageId(null);
        setSpeechState("idle");
        activeUtteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        // "canceled" or "interrupted" is normal when stopping or changing message
        if (event.error !== "canceled" && event.error !== "interrupted") {
          console.warn("Speech synthesis error:", event.error);
          setVoiceError(`Speech error: ${event.error || "Unable to play audio"}`);
        }
        setSpeakingMessageId(null);
        setSpeechState("idle");
        activeUtteranceRef.current = null;
      };

      activeUtteranceRef.current = utterance;
      setSpeakingMessageId(msg.id);
      setSpeechState("playing");

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech synthesis failed:", err);
      handleStopSpeech();
      setVoiceError("Failed to start voice output. Please try again.");
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore if already inactive
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      stopVoiceInput();
      return;
    }

    setVoiceError(null);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        "Voice input is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Safari."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      // Retain existing text so voice input appends naturally
      const currentText = input;
      const prefix = currentText
        ? currentText.endsWith(" ")
          ? currentText
          : currentText + " "
        : "";
      baseInputRef.current = prefix;

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceError(null);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(prefix + transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsRecording(false);
        recognitionRef.current = null;

        switch (event.error) {
          case "not-allowed":
          case "service-not-allowed":
            setVoiceError(
              "Microphone permission was denied. Please allow microphone access in your browser settings."
            );
            break;
          case "no-speech":
            setVoiceError("No speech was detected. Please try speaking again.");
            break;
          case "audio-capture":
            setVoiceError(
              "No microphone found. Please ensure your microphone is connected and working."
            );
            break;
          case "network":
            setVoiceError(
              "Network error occurred during speech recognition. Please check your internet connection."
            );
            break;
          case "aborted":
            // Normal stop/abort; do not show error
            break;
          default:
            setVoiceError(`Voice input error: ${event.error}. Please try again.`);
            break;
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsRecording(false);
      recognitionRef.current = null;
      setVoiceError(
        "Could not access microphone. Please check permissions and try again."
      );
    }
  };

  const handleSend = async (textToSend) => {
    if (isRecording) {
      stopVoiceInput();
    }
    handleStopSpeech();

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
    if (isRecording) {
      stopVoiceInput();
    }
    handleStopSpeech();
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
                  <div
                    className={
                      msg.role === "user"
                        ? "nestai-user-bubble"
                        : `nestai-assistant-bubble ${
                            speakingMessageId === msg.id && speechState === "playing"
                              ? "nestai-bubble-speaking"
                              : ""
                          }`
                    }
                  >
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

                  {/* Assistant Message Actions & TTS Bar */}
                  {msg.role === "assistant" && (
                    <div className="nestai-msg-toolbar">
                      <span className="nestai-msg-time">{msg.timestamp}</span>

                      <div className="nestai-tts-bar">
                        {speakingMessageId === msg.id ? (
                          <div className="nestai-tts-active-controls">
                            {speechState === "playing" ? (
                              <div className="nestai-tts-wave" title="Speaking aloud">
                                <span className="nestai-tts-wave-bar" />
                                <span className="nestai-tts-wave-bar" />
                                <span className="nestai-tts-wave-bar" />
                                <span className="nestai-tts-wave-bar" />
                              </div>
                            ) : (
                              <span className="nestai-tts-paused-label">Paused</span>
                            )}

                            {speechState === "playing" ? (
                              <button
                                type="button"
                                className="nestai-tts-ctrl-btn nestai-tts-pause"
                                onClick={handlePauseSpeech}
                                title="Pause speech"
                                aria-label="Pause speech"
                              >
                                <Pause size={12} />
                                <span>Pause</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="nestai-tts-ctrl-btn nestai-tts-resume"
                                onClick={handleResumeSpeech}
                                title="Resume speech"
                                aria-label="Resume speech"
                              >
                                <Play size={12} />
                                <span>Resume</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="nestai-tts-ctrl-btn nestai-tts-stop"
                              onClick={handleStopSpeech}
                              title="Stop speech"
                              aria-label="Stop speech"
                            >
                              <Square size={11} />
                              <span>Stop</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="nestai-tts-btn"
                            onClick={() => handleSpeak(msg)}
                            title="Read response aloud (Voice Output)"
                            aria-label="Read response aloud"
                          >
                            <Volume2 size={13} />
                            <span>Read aloud</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

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
            {/* Active Recording Indicator Banner */}
            {isRecording && (
              <div
                className="nestai-recording-indicator"
                id="nestai-recording-indicator"
              >
                <div className="nestai-recording-indicator-left">
                  <span className="nestai-recording-pulse-dot" />
                  <span className="nestai-recording-text">
                    Listening to speech...
                  </span>
                </div>
                <button
                  type="button"
                  className="nestai-recording-stop-btn"
                  onClick={stopVoiceInput}
                >
                  Done
                </button>
              </div>
            )}

            {/* Voice Error Notification Banner */}
            {voiceError && (
              <div
                className="nestai-voice-error"
                id="nestai-voice-error"
                role="alert"
              >
                <div className="nestai-voice-error-content">
                  <AlertCircle size={14} className="nestai-voice-error-icon" />
                  <span>{voiceError}</span>
                </div>
                <button
                  type="button"
                  className="nestai-voice-error-dismiss"
                  onClick={() => setVoiceError(null)}
                  aria-label="Dismiss error"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <form
              className={`nestai-input-form ${isRecording ? "nestai-input-form-recording" : ""}`}
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
                placeholder={
                  isRecording
                    ? "Listening to your voice..."
                    : "Ask about papers, algorithms, or features..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isThinking}
              />
              <button
                type="button"
                id="nestai-mic-btn"
                className={`nestai-mic-btn ${isRecording ? "nestai-mic-recording" : ""}`}
                onClick={handleToggleVoice}
                disabled={isThinking}
                title={
                  isRecording
                    ? "Stop voice recording"
                    : "Click to speak (Voice Input)"
                }
                aria-label={
                  isRecording
                    ? "Stop voice recording"
                    : "Start voice recording"
                }
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
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
