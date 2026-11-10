import { useNavigate } from "react-router-dom";
import useVoiceCommand from "../hooks/useVoiceCommand";
import { Mic } from "lucide-react";

/**
 * VoiceAssistant – a tiny always‑on voice‑command button.
 * • Listens via the Web Speech API (via useVoiceCommand hook)
 * • Maps spoken intents to navigation actions
 * • Shows toast notifications for unknown commands or errors
 * • Hidden on small screens via a CSS media query (see global.css)
 */
export default function VoiceAssistant() {
    const navigate = useNavigate();

    /**
     * Handles the normalized intent string coming from the hook.
     * Supported intents:
     *   - goto-saved-papers
     *   - recommend-papers
     *   - goto-home
     *   - open-notifications
     *   - show-profile
     *   - search:<query>
     *   - error:<msg>
     *   - unrecognized (fallback)
     */
    const handleIntent = async (intent) => {
        console.log('Voice intent received:', intent);
        // Core intents
        if (intent === "goto-saved-papers") {
            navigate("/workspace/saved");
        } else if (intent === "recommend-papers" || intent === "goto-discover") {
            // "discover" intent alias
            navigate("/workspace/discover");
        } else if (intent === "goto-home") {
            navigate("/workspace");
        } else if (intent === "goto-login") {
            navigate("/login");
        } else if (intent === "goto-signup") {
            navigate("/signup");
        }
        // Extra intents added in useVoiceCommand
        else if (intent === "open-notifications") {
            const ev = new CustomEvent("open-notifications");
            window.dispatchEvent(ev);
        } else if (intent === "show-profile") {
            showToast("Open your profile from the menu at the top right.", "info");
        } else if (intent.startsWith("search:")) {
            const query = intent.replace(/^search:/, "");
            navigate(`/workspace/discover?q=${encodeURIComponent(query)}`);
        } else if (intent.startsWith("error:")) {
            const errMsg = intent.replace(/^error:/, "");
            showToast(`Voice error: ${errMsg}`, "error");
        } else {
            showToast("Sorry, I didn’t understand that command.", "warning");
        }
    };

    // Listening starts when the mic button is pressed (no mic prompt on page load).
    const { restart, listening } = useVoiceCommand(handleIntent);

    return (
        <button
            type="button"
            className={`voice-btn ${listening ? "voice-btn-listening" : ""}`}
            title={listening ? "Listening..." : "Speak a command"}
            aria-label={listening ? "Listening for a voice command" : "Speak a command"}
            aria-pressed={listening}
            onClick={restart}
            style={{
                zIndex: 900,
                display: "grid",
                placeItems: "center",
                background: listening
                    ? "linear-gradient(135deg, #db2777, #7c3aed)"
                    : "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#fff",
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 20px -6px rgba(124, 58, 237, 0.6)",
            }}
        >
            <Mic size={22} aria-hidden="true" />
        </button>
    );
}

/* --------------------------------------------------------------
   Tiny toast implementation – no external library required.
   ---------------------------------------------------------------- */
function showToast(message, type = "info") {
    // Ensure a container exists
    let container = document.getElementById("voice-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "voice-toast-container";
        container.style.position = "fixed";
        container.style.top = "1rem";
        container.style.right = "1rem";
        container.style.zIndex = "9999";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "0.5rem";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.minWidth = "200px";
    toast.style.padding = "0.5rem 0.75rem";
    toast.style.borderRadius = "4px";
    toast.style.fontSize = "0.875rem";
    toast.style.color = "#fff";
    toast.style.background =
        type === "error"
            ? "#d32f2f"
            : type === "warning"
                ? "#f57c00"
                : "#1976d2";
    toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";

    // Auto‑remove after 3 seconds
    setTimeout(() => {
        toast.remove();
        if (!container?.hasChildNodes()) container?.remove();
    }, 3000);

    container.appendChild(toast);
}