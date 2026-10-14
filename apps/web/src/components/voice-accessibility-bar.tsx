"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  Pause,
  Play,
  Square,
  Send,
  Trash2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  X,
} from "lucide-react";
import {
  chatWithAssistant,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n-context";
import { useProfile } from "@/lib/profile-context";
import { AssistantMessageItem, LanguageCode } from "@/lib/types";

interface VoiceAccessibilityBarProps {
  /** Optional callback to also copy recognized speech into a page-specific box (e.g. Rescue input) */
  onTranscriptText?: (spokenText: string) => void;
  /** Optional page text to read aloud when user clicks Read Page Summary */
  textToReadAloud?: string;
  compact?: boolean;
  onCloseDrawer?: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

export function VoiceAccessibilityBar({
  onTranscriptText,
  textToReadAloud,
  compact = false,
  onCloseDrawer,
}: VoiceAccessibilityBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useProfile();
  const { lang, setLang, speechLang, isRtl, t } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputDraft, setInputDraft] = useState("");
  const [history, setHistory] = useState<AssistantMessageItem[]>([]);
  const [lastSubmittedText, setLastSubmittedText] = useState<string>("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);

  // Audio playback state (Cloud HTML5 Audio or Verified Device Voice)
  const [ttsState, setTtsState] = useState<"idle" | "playing" | "paused">("idle");
  const [lastSpokenText, setLastSpokenText] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAllMedia = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setTtsState("idle");
  };

  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  // Sentence boundary chunker so browser speech synthesis never cuts off on long paragraphs
  const chunkTextForSpeech = (text: string, maxChars = 200): string[] => {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return [];
    if (cleaned.length <= maxChars) return [cleaned];
    const sentences = cleaned.split(/(?<=[.!?।۔\n])\s+/);
    const chunks: string[] = [];
    let current = "";
    for (const sent of sentences) {
      if ((current + " " + sent).trim().length <= maxChars) {
        current = (current + " " + sent).trim();
      } else {
        if (current) chunks.push(current);
        current = sent;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  };

  // Pure browser-native text-to-speech without any paid API or external service
  const speakTranslatedText = (textToSpeak: string, targetLang: LanguageCode = lang) => {
    const cleanText = textToSpeak.trim();
    if (!cleanText) return;

    // Prevent overlapping audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setTtsNotice(null);
    setVoiceError(null);
    setLastSpokenText(cleanText);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceError("Audio playback is not supported in this browser. Please read the response above.");
      setTtsState("idle");
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    const langPrefix = targetLang.toLowerCase();

    // Check for a matching native voice
    const matchingVoice = voices.find((v) =>
      v.lang.toLowerCase().replace(/_/g, "-").startsWith(langPrefix)
    );

    // CRITICAL: Never read Telugu or Urdu text using an English phonetics voice!
    if (!matchingVoice && (targetLang === "te" || targetLang === "ur")) {
      setTtsState("idle");
      setTtsNotice(
        targetLang === "te"
          ? "A native Telugu voice is not installed on this device. The complete written answer is displayed above. To enable spoken Telugu, you can install the free Telugu speech pack in your operating system settings (Windows Settings > Time & Language > Speech, or Android Text-to-Speech)."
          : "A native Urdu voice is not installed on this device. The complete written answer is displayed above. To enable spoken Urdu, you can install the free Urdu speech pack in your operating system settings (Windows Settings > Time & Language > Speech, or Android Text-to-Speech)."
      );
      return;
    }

    setTtsState("playing");
    const chunks = chunkTextForSpeech(cleanText);
    let chunkIdx = 0;

    const speakNextChunk = () => {
      if (chunkIdx >= chunks.length) {
        setTtsState("idle");
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[chunkIdx]);
      utterance.lang = matchingVoice ? matchingVoice.lang : speechLang;
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
      utterance.onend = () => {
        chunkIdx++;
        speakNextChunk();
      };
      utterance.onerror = () => {
        setTtsState("idle");
      };
      window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  };

  // Submit question to backend context-aware assistant (keeps modal open for multi-turn chat)
  const submitQuestion = async (rawQuestion: string, allowDuplicate = false) => {
    const trimmed = rawQuestion.trim();
    if (!trimmed || isProcessing) return;

    if (!allowDuplicate && trimmed === lastSubmittedText) {
      return;
    }
    setLastSubmittedText(trimmed);
    setVoiceError(null);
    setIsProcessing(true);

    const userMsg: AssistantMessageItem = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [...history, userMsg];
    setHistory(updatedHistory);
    setInputDraft("");

    if (onTranscriptText) {
      onTranscriptText(trimmed);
    }

    // Extract current scheme slug if on /schemes/[id]
    const schemeSlugMatch = pathname?.startsWith("/schemes/")
      ? pathname.replace("/schemes/", "").split("/")[0]
      : null;

    try {
      const res = await chatWithAssistant({
        message: trimmed,
        lang,
        current_path: pathname || "/",
        current_scheme_slug: schemeSlugMatch,
        profile,
        history: updatedHistory.slice(-8),
      });

      if (res.lang && res.lang !== lang) {
        setLang(res.lang);
      }

      const fullReply = res.follow_up_question
        ? `${res.reply_text}\n\n${res.follow_up_question}`
        : res.reply_text;

      const assistantMsg: AssistantMessageItem = {
        role: "assistant",
        content: fullReply,
        timestamp: new Date().toISOString(),
      };
      setHistory((prev) => [...prev, assistantMsg]);

      // Execute explicit action directive ONLY when returned by backend
      if (res.action.action_type === "STOP_AUDIO") {
        stopAllMedia();
      } else if (res.action.action_type === "GO_BACK") {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      } else if (res.action.action_type === "NAVIGATE" && res.action.target_path) {
        router.push(res.action.target_path);
      }
    } catch (err: unknown) {
      setVoiceError(
        err instanceof Error
          ? err.message
          : "Unable to reach PolicyPilot Assistant. Please check your connection."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual single-turn microphone capture (never secretly records continuously)
  const handleToggleMic = () => {
    setVoiceError(null);

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRecognitionAPI =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError(
        "Speech recognition is not supported by this browser. Please type your question in the editable box below."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimOrFinal = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          interimOrFinal += event.results[i][0].transcript;
        }
        if (interimOrFinal.trim()) {
          // Place recognized speech into the editable input box so user can review/edit or press Send
          setInputDraft(interimOrFinal.trim());
        }
      };

      recognition.onerror = (event: { error?: string }) => {
        setIsListening(false);
        const code = event?.error || "unknown";
        if (code === "not-allowed" || code === "permission-denied") {
          setVoiceError(
            "Microphone permission was denied. Please allow microphone access or type your question below."
          );
        } else if (code === "no-speech") {
          setVoiceError("No speech was detected. Tap the microphone to try again or type below.");
        } else {
          setVoiceError(`Speech recognition error (${code}). You can edit or type your question below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError("Could not start microphone. Please use the text box below.");
    }
  };

  const handlePauseTTS = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setTtsState("paused");
      return;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setTtsState("paused");
    }
  };

  const handleResumeTTS = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setTtsState("playing");
      return;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setTtsState("playing");
    }
  };

  const latestAssistantReply =
    [...history].reverse().find((m) => m.role === "assistant")?.content ||
    textToReadAloud ||
    "";

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      aria-label={t("voice_modal_title")}
      className={`rounded-2xl border border-indigo-200 bg-indigo-50/70 ${
        compact ? "p-3.5" : "p-5"
      } space-y-3 shadow-xs`}
    >
      {/* Top Header & Close/Stop Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4F46E5] shrink-0" />
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#17213F]">
              {t("voice_modal_title")}
            </h3>
            {!compact && (
              <p className="text-[11px] text-[#667085]">{t("voice_modal_subtitle")}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setHistory([]);
                setLastSubmittedText("");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{t("voice_clear_history")}</span>
            </button>
          )}

          {onCloseDrawer && (
            <button
              type="button"
              onClick={() => {
                stopAllMedia();
                onCloseDrawer();
              }}
              aria-label={t("btn_close")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-gray-800 hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t("btn_close")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Turn Conversation Transcript */}
      {history.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-2.5 bg-white/90 rounded-xl p-3 border border-indigo-100">
          {history.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                item.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs whitespace-pre-wrap leading-relaxed ${
                  item.role === "user"
                    ? "bg-[#4F46E5] text-white font-medium"
                    : "bg-slate-100 text-[#17213F] border border-slate-200"
                }`}
              >
                {item.content}
              </div>
              {item.role === "assistant" && (
                <button
                  type="button"
                  onClick={() => speakTranslatedText(item.content, lang)}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F46E5] hover:underline cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{t("tts_play")}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Editable Speech & Text Question Input Form (Supports Unlimited Consecutive Turns) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuestion(inputDraft, true);
        }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
      >
        <button
          type="button"
          onClick={handleToggleMic}
          aria-label={isListening ? t("voice_stop_mic") : t("voice_start_mic")}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            isListening
              ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
              : "bg-white hover:bg-gray-50 text-[#17213F] border border-gray-300"
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>{t("voice_stop_mic")}</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-[#4F46E5]" />
              <span>{t("voice_start_mic")}</span>
            </>
          )}
        </button>

        <input
          type="text"
          value={inputDraft}
          onChange={(e) => setInputDraft(e.target.value)}
          placeholder={
            isListening
              ? t("voice_listening")
              : "Ask e.g. 'Explain PM-KISAN in Telugu', 'What documents do I need?', or 'Check scheme updates'..."
          }
          className="flex-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#17213F] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />

        <button
          type="submit"
          disabled={!inputDraft.trim() || isProcessing}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isProcessing ? "..." : t("voice_send_btn")}</span>
        </button>
      </form>

      {/* Audio Playback & Natural Question Suggestions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            "What scholarships can I apply for?",
            "Explain PM-KISAN in Telugu",
            "Why was my application marked defective?",
            "Show me recently verified scheme updates",
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => submitQuestion(sample, true)}
              className="text-[11px] bg-white hover:bg-indigo-100/70 text-[#17213F] border border-indigo-200 px-2.5 py-1 rounded-full transition cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* TTS Play / Pause / Resume / Stop / Replay Controls */}
        {latestAssistantReply && (
          <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {ttsState === "idle" && (
              <button
                type="button"
                onClick={() => speakTranslatedText(latestAssistantReply, lang)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-[#17213F] hover:bg-gray-100 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>{t("tts_play")}</span>
              </button>
            )}

            {ttsState === "playing" && (
              <button
                type="button"
                onClick={handlePauseTTS}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{t("tts_pause")}</span>
              </button>
            )}

            {ttsState === "paused" && (
              <button
                type="button"
                onClick={handleResumeTTS}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{t("tts_resume")}</span>
              </button>
            )}

            {ttsState !== "idle" && (
              <button
                type="button"
                onClick={stopAllMedia}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <Square className="w-3 h-3" />
                <span>{t("tts_stop")}</span>
              </button>
            )}

            {lastSpokenText && ttsState === "idle" && (
              <button
                type="button"
                onClick={() => speakTranslatedText(lastSpokenText, lang)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                title={t("tts_replay")}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t("tts_replay")}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {ttsNotice && (
        <div className="text-[11px] text-slate-600 bg-white/80 px-3 py-1.5 rounded border border-slate-200">
          {ttsNotice}
        </div>
      )}

      {voiceError && (
        <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{voiceError}</span>
        </div>
      )}
    </section>
  );
}
