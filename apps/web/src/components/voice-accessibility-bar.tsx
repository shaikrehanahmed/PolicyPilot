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
  Scale,
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
  onTranscriptText?: (spokenText: string) => void;
  textToReadAloud?: string;
  compact?: boolean;
  onCloseDrawer?: () => void;
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

  const [ttsState, setTtsState] = useState<"idle" | "playing" | "paused">("idle");
  const [lastSpokenText, setLastSpokenText] = useState<string>("");
  const recognitionRef = useRef<any>(null);
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
          : "Unable to reach PolicyPilot Counsel. Please verify backend connectivity."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleMic = () => {
    setVoiceError(null);

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError(
        "Browser speech recognition is unavailable on this device. Please type your inquiry below."
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

      recognition.onresult = (event: any) => {
        let spoken = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          spoken += event.results[i][0].transcript;
        }
        if (spoken.trim()) {
          setInputDraft(spoken.trim());
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        const code = event?.error || "unknown";
        if (code === "not-allowed" || code === "permission-denied") {
          setVoiceError(
            "Microphone access was declined. Please permit microphone access or type your inquiry below."
          );
        } else if (code === "no-speech") {
          setVoiceError("No speech detected. Tap Speak Question again or type below.");
        } else {
          setVoiceError(`Speech capture interrupted (${code}). Please edit or type below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError("Could not initialize microphone. Please use the text field below.");
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
      className={`sage-panel rounded-2xl ${
        compact ? "p-3.5" : "p-5"
      } space-y-3.5`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CFDBD1] pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#163026] text-[#C5A572] flex items-center justify-center shrink-0">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#141815]">
              {t("voice_modal_title")}
            </h3>
            {!compact && (
              <p className="text-[11px] text-[#4A524C]">{t("voice_modal_subtitle")}</p>
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
              className="btn-parchment inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
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
              className="btn-parchment inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t("btn_close")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Turn Conversation Ledger */}
      {history.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-3 bg-[#FCFBF7] rounded-xl p-3.5 border border-[#D8D1C2]">
          {history.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                item.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[92%] rounded-xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed ${
                  item.role === "user"
                    ? "bg-[#163026] text-[#F7F4EC] font-medium"
                    : "bg-[#EFECE2] text-[#141815] border border-[#D8D1C2]"
                }`}
              >
                {item.content}
              </div>
              {item.role === "assistant" && (
                <button
                  type="button"
                  onClick={() => speakTranslatedText(item.content, lang)}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#163026] hover:underline cursor-pointer"
                >
                  <Volume2 className="w-3 h-3 text-[#8C6D3B]" />
                  <span>{t("tts_play")}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Editable Speech & Text Question Input */}
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
          className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            isListening
              ? "bg-[#8B261D] text-white animate-pulse"
              : "btn-parchment"
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>{t("voice_stop_mic")}</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-[#163026]" />
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
              : "Ask e.g. 'Explain PM-KISAN in Telugu', 'What documents do I need?', or 'Show verified scheme updates'..."
          }
          className="flex-1 rounded-xl border border-[#BFB6A4] bg-[#FCFBF7] px-3.5 py-2.5 text-xs sm:text-sm text-[#141815] focus:outline-none focus:ring-2 focus:ring-[#163026]"
        />

        <button
          type="submit"
          disabled={!inputDraft.trim() || isProcessing}
          className="btn-forest inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5 text-[#C5A572]" />
          <span>{isProcessing ? "..." : t("voice_send_btn")}</span>
        </button>
      </form>

      {/* Prompt Suggestions & Audio Controls */}
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
              className="text-[11px] bg-[#FCFBF7] hover:bg-[#EFECE2] text-[#141815] border border-[#D8D1C2] px-2.5 py-1 rounded-md transition cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>

        {latestAssistantReply && (
          <div className="inline-flex items-center gap-1 bg-[#FCFBF7] border border-[#D8D1C2] rounded-lg p-1">
            {ttsState === "idle" && (
              <button
                type="button"
                onClick={() => speakTranslatedText(latestAssistantReply, lang)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold text-[#163026] hover:bg-[#EFECE2] cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#8C6D3B]" />
                <span>{t("tts_play")}</span>
              </button>
            )}

            {ttsState === "playing" && (
              <button
                type="button"
                onClick={handlePauseTTS}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold text-[#694F25] bg-[#F2EADB] cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{t("tts_pause")}</span>
              </button>
            )}

            {ttsState === "paused" && (
              <button
                type="button"
                onClick={handleResumeTTS}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold text-[#163026] bg-[#E6ECE7] cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{t("tts_resume")}</span>
              </button>
            )}

            {ttsState !== "idle" && (
              <button
                type="button"
                onClick={stopAllMedia}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold text-[#8B261D] hover:bg-red-50 cursor-pointer"
              >
                <Square className="w-3 h-3" />
                <span>{t("tts_stop")}</span>
              </button>
            )}

            {lastSpokenText && ttsState === "idle" && (
              <button
                type="button"
                onClick={() => speakTranslatedText(lastSpokenText, lang)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-[#4A524C] hover:bg-[#EFECE2] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t("tts_replay")}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {ttsNotice && (
        <div className="text-[11px] text-[#4A524C] bg-[#FCFBF7] px-3 py-1.5 rounded-lg border border-[#D8D1C2]">
          {ttsNotice}
        </div>
      )}

      {voiceError && (
        <div className="flex items-center gap-2 text-xs text-[#694F25] bg-[#F2EADB] border border-[#D4C098] px-3.5 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 text-[#8C6D3B] shrink-0" />
          <span>{voiceError}</span>
        </div>
      )}
    </section>
  );
}
