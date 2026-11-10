import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useVoiceCommand - tiny wrapper around the Web Speech API.
 *
 * - Does NOT listen on page load (no surprise mic permission prompt).
 *   Listening starts only when `restart()` is called (e.g. a mic button).
 * - Two modes:
 *     1. Dictation: pass `options.onTranscript(text, isFinal)` - you get the raw
 *        words (live, if `options.interim` is true). Used by the NestAI chatbot.
 *     2. Commands: without `onTranscript`, the final sentence is turned into an
 *        intent string and passed to `onIntent`:
 *          goto-saved-papers | recommend-papers | goto-home | open-notifications |
 *          show-profile | search:<query> | unrecognized
 * - Errors always arrive through `onIntent` as `error:<message>`.
 *
 * Returns { restart, stop, listening, supported }.
 */

function getRecognitionClass() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function transcriptToIntent(raw) {
  // Debug: log raw transcript
  console.debug('Raw transcript:', raw);

  const text = String(raw || "").toLowerCase().trim().replace(/[.!?]+$/, "");
  if (!text) return "unrecognized";

  // "search for transformers", "find papers on diffusion", "look up mamba"
  const searchMatch = text.match(
    /^(?:search(?: for)?|find(?: me)?(?: papers? (?:on|about))?|look up)\s+(.+)$/
  );
  if (searchMatch && searchMatch[1]) return `search:${searchMatch[1].trim()}`;

  if (/\b(saved|bookmark|bookmarks|library)\b/.test(text)) return "goto-saved-papers";
  if (/\b(discover|go to discover|show me discover)\b/.test(text)) return "goto-discover";
  if (/\b(recommend|recommendation|recommendations|discover|suggest|suggestions)\b/.test(text)) {
    return "recommend-papers";
  }
  if (/\b(notification|notifications|alerts?)\b/.test(text)) return "open-notifications";
  if (/\b(profile|account)\b/.test(text)) return "show-profile";
  if (/\b(home|dashboard|workspace)\b/.test(text)) return "goto-home";
  // navigation intents for auth pages
  if (/\b(sign[- ]?in|log[- ]?in|login)\b/.test(text)) return "goto-login";
  if (/\b(sign[- ]?up|register|sign[- ]?up)\b/.test(text)) return "goto-signup";
}

export default function useVoiceCommand(onIntent, options = {}) {
  const recognitionRef = useRef(null);
  const onIntentRef = useRef(onIntent);
  const optionsRef = useRef(options);
  const [listening, setListening] = useState(false);
  const supported = Boolean(getRecognitionClass());

  // Always call the latest handlers without re-creating the recognizer
  useEffect(() => {
    onIntentRef.current = onIntent;
    optionsRef.current = options;
  });

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const restart = useCallback(() => {
    const Recognition = getRecognitionClass();
    if (!Recognition) {
      onIntentRef.current?.("error:Speech recognition is not supported in this browser");
      return;
    }

    // Tear down any previous session before starting a new one
    try {
      recognitionRef.current?.abort();
    } catch {
      /* nothing to abort */
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = Boolean(optionsRef.current.interim);
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      setListening(false);
      // "no-speech" / "aborted" are normal, not worth an error message
      if (event.error && event.error !== "no-speech" && event.error !== "aborted") {
        onIntentRef.current?.(`error:${event.error}`);
      }
    };
    recognition.onresult = (event) => {
      let transcript = "";
      let isFinal = false;
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      transcript = transcript.trim();

      const onTranscript = optionsRef.current.onTranscript;
      if (onTranscript) {
        onTranscript(transcript, isFinal);
      } else if (isFinal) {
        onIntentRef.current?.(transcriptToIntent(transcript));
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }, []);

  // Stop the mic if the component unmounts mid-session
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return { restart, stop, listening, supported };
}
