"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  AlertCircle,
  Keyboard,
  Send,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceAssistantModal({ isOpen, onClose }: VoiceAssistantProps) {
  const router = useRouter();
  const { language, t, speechCode } = useI18n();

  const [isSupported, setIsSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speakText = useCallback(
    (textToSpeak: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = speechCode;
      utterance.rate = 0.95;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [speechCode]
  );

  const processQuery = useCallback(
    (query: string) => {
      const q = query.toLowerCase().trim();
      let reply = "";
      let targetRoute: string | null = null;

      // 1. Navigation routing
      if (
        q.includes("scheme") ||
        q.includes("పథక") ||
        q.includes("योजना") ||
        q.includes("explore") ||
        q.includes("list")
      ) {
        targetRoute = "/schemes";
        reply =
          language === "te"
            ? "ప్రభుత్వ పథకాల పేజీకి తీసుకువెళ్తున్నాను."
            : language === "hi"
            ? "सरकारी योजनाओं की सूची खोली जा रही है।"
            : "Navigating to Government Schemes Discovery.";
      } else if (
        q.includes("rescue") ||
        q.includes("defect") ||
        q.includes("reject") ||
        q.includes("రెస్క్యూ") ||
        q.includes("రెకవరీ") ||
        q.includes("रेस्क्यू") ||
        q.includes("अटक")
      ) {
        targetRoute = "/rescue";
        reply =
          language === "te"
            ? "రెస్క్యూ మోడ్ పేజీకి తీసుకువెళ్తున్నాను. ఇక్కడ మీ నిలిచిపోయిన దరఖాస్తును సరిచేసుకోవచ్చు."
            : language === "hi"
            ? "रेस्क्यू मोड खोला जा रहा है। यहां आप अपने लंबित आवेदन को ठीक कर सकते हैं।"
            : "Opening PolicyPilot Rescue Mode for application defect triage.";
      } else if (
        q.includes("update") ||
        q.includes("news") ||
        q.includes("notice") ||
        q.includes("అప్డేట్") ||
        q.includes("నోటీస్") ||
        q.includes("अपडेट") ||
        q.includes("गजट")
      ) {
        targetRoute = "/updates";
        reply =
          language === "te"
            ? "నూతన పథకాల అప్డేట్లు మరియు గెజిట్ పేజీకి తీసుకువెళ్తున్నాను."
            : language === "hi"
            ? "नवीनतम सरकारी योजना अपडेट्स और गजट रजिस्ट्री खोली जा रही है।"
            : "Opening Government Scheme Updates and Gazette Registry.";
      } else if (
        q.includes("profile") ||
        q.includes("citizen") ||
        q.includes("income") ||
        q.includes("ప్రొఫైల్") ||
        q.includes("ఆదాయం") ||
        q.includes("प्रोफाइल")
      ) {
        targetRoute = "/profile";
        reply =
          language === "te"
            ? "మీ పౌర ప్రొఫైల్ పేజీకి తీసుకువెళ్తున్నాను."
            : language === "hi"
            ? "नागरिक प्रोफाइल पेज खोला जा रहा है।"
            : "Opening Citizen Demographic Profile.";
      }
      // 2. Knowledge queries grounded in official demo repo
      else if (
        q.includes("kisan") ||
        q.includes("కిసాన్") ||
        q.includes("किसान") ||
        q.includes("6000") ||
        q.includes("6,000")
      ) {
        reply =
          language === "te"
            ? "పీఎం-కిసాన్ పథకం ద్వారా సాగు భూమి ఉన్న రైతులకు ఏడాదికి ₹6,000 పెట్టుబడి సహాయం మూడు విడతల్లో అందుతుంది. బ్యాంక్ ఖాతాకు NPCI DBT మ్యాపర్ లింక్ తప్పనిసరి."
            : language === "hi"
            ? "पीएम-किसान योजना के अंतर्गत पात्र भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 तीन किस्तों में सीधे डीबीटी खाते में मिलते हैं।"
            : "PM-KISAN provides ₹6,000 per year in three installments to eligible landholding farmers via NPCI DBT bank accounts.";
      } else if (
        q.includes("jay") ||
        q.includes("ayushman") ||
        q.includes("health") ||
        q.includes("ఆరోగ్య") ||
        q.includes("ఆయుష్మాన్") ||
        q.includes("आयुष्मान") ||
        q.includes("70")
      ) {
        reply =
          language === "te"
            ? "ఆయుష్మాన్ భారత్ పీఎం-జేవై కింద కుటుంబానికి ఏటా ₹5 లక్షల వరకు ఉచిత ఆసుపత్రి చికిత్స లభిస్తుంది. 70 ఏళ్లు పైబడిన సీనియర్ సిటిజన్లందరికీ ఆదాయ పరిమితి లేకుండా ఇది వర్తిస్తుంది."
            : language === "hi"
            ? "आयुष्मान भारत पीएम-जेएवाई प्रति परिवार प्रति वर्ष ₹5,00,000 का मुफ्त इलाज प्रदान करता है। 70 वर्ष से अधिक आयु के सभी वरिष्ठ नागरिक इसके पात्र हैं।"
            : "Ayushman Bharat PM-JAY covers up to ₹5,00,000 in secondary and tertiary hospitalization per family, with universal coverage for seniors aged 70+.";
      } else if (
        q.includes("scholarship") ||
        q.includes("nsp") ||
        q.includes("student") ||
        q.includes("విద్యార్థి") ||
        q.includes("స్కాలర్షిప్") ||
        q.includes("छात्रवृत्ति")
      ) {
        reply =
          language === "te"
            ? "NSP పోస్ట్-మెట్రిక్ ఎస్సీ స్కాలర్షిప్ కుటుంబ వార్షిక ఆదాయం ₹2.5 లక్షల లోపు ఉన్న విద్యార్థులకు వర్తిస్తుంది. ఫారమ్ డిఫెక్టివ్ అయితే Withdraw చేయకుండా OTR ద్వారా రిఫ్రెష్ చేయాలి."
            : language === "hi"
            ? "NSP पोस्ट-मैट्रिक छात्रवृत्ति ₹2.5 लाख तक की आय वाले एससी छात्रों के लिए है। दोषपूर्ण फॉर्म को वापस (Withdraw) न लें, OTR रिफ्रेश से ठीक करें।"
            : "The NSP Post-Matric SC Scholarship covers tuition fees for students with family income under ₹2.5 Lakhs. Update defects via OTR Refresh rather than withdrawing.";
      } else if (
        q.includes("rythu") ||
        q.includes("bharosa") ||
        q.includes("రైతు భరోసా") ||
        q.includes("12000") ||
        q.includes("12,000")
      ) {
        reply =
          language === "te"
            ? "తెలంగాణ రైతు భరోసా కింద డిజిటల్ పట్టాదారు పాస్బుక్ ఉన్న రైతులకు ఎకరానికి ఏడాదికి ₹12,000 పెట్టుబడి సహాయం అందుతుంది."
            : language === "hi"
            ? "तेलंगाना रायथू भरोसा योजना के तहत डिजिटल पट्टादार पासबुक धारक किसानों को प्रति एकड़ प्रति वर्ष ₹12,000 दिए जाते हैं।"
            : "Telangana Rythu Bharosa grants ₹12,000 per acre annually to farmers holding verified digital Pattadar Passbooks.";
      } else if (
        q.includes("awaas") ||
        q.includes("pmay") ||
        q.includes("house") ||
        q.includes("ఇల్లు") ||
        q.includes("ఆవాస్") ||
        q.includes("मकान")
      ) {
        reply =
          language === "te"
            ? "పీఎం ఆవాస్ యోజన గ్రామీణ్ కింద మైదాన ప్రాంతాలలో ₹1,20,000 మరియు కొండ ప్రాంతాలలో ₹1,30,000 పక్కా ఇంటి నిర్మాణ సహాయం లభిస్తుంది."
            : language === "hi"
            ? "पीएम आवास योजना - ग्रामीण के तहत कच्चे मकान वाले पात्र परिवारों को ₹1,20,000 से ₹1,30,000 का अनुदान दिया जाता है।"
            : "PMAY-G provides ₹1,20,000 to ₹1,30,000 to rural houseless or kutcha-house families meeting 15 exclusion rules.";
      } else {
        reply =
          language === "te"
            ? `నేను మీ అభ్యర్థనను విన్నాను: "${query}". ప్రభుత్వ పథకాల వివరాలు, రెస్క్యూ మోడ్ లేదా తాజా అప్డేట్ల కోసం అడగండి.`
            : language === "hi"
            ? `मैंने आपका अनुरोध सुना: "${query}"। योजनाओं, रेस्क्यू मोड या नई अपडेट्स के बारे में पूछें।`
            : `I understood: "${query}". You can ask about government schemes, Rescue Mode, or say "show schemes".`;
      }

      setAssistantResponse(reply);
      speakText(reply);

      if (targetRoute) {
        setTimeout(() => {
          router.push(targetRoute!);
          onClose();
        }, 1800);
      }
    },
    [language, router, onClose, speakText]
  );

  const startListening = () => {
    if (typeof window === "undefined") return;
    stopSpeaking();
    setErrorMessage(null);
    setTranscript("");
    setAssistantResponse(null);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(t("voice.unsupported"));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = speechCode;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        processQuery(text);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        if (event.error === "not-allowed") {
          setErrorMessage(t("voice.permissionDenied"));
        } else if (event.error === "no-speech") {
          setErrorMessage(
            language === "te"
              ? "ఏ శబ్దమూ వినిపించలేదు. దయచేసి మళ్లీ మాట్లాడండి."
              : language === "hi"
              ? "कोई आवाज नहीं सुनाई दी। कृपया पुनः बोलें।"
              : "No speech was detected. Please try speaking again."
          );
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      setIsListening(false);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to initialize microphone."
      );
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const q = textInput.trim();
    setTranscript(q);
    setTextInput("");
    processQuery(q);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="voice-modal-title" className="text-sm font-bold text-[#17213F]">
                {t("voice.title")}
              </h2>
              <p className="text-[11px] text-[#667085]">{t("voice.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopListening();
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Active Language Badge */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#667085]">Active Voice Language:</span>
            <span className="font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-[#4F46E5] border border-indigo-200">
              {speechCode.toUpperCase()} ·{" "}
              {language === "te"
                ? "తెలుగు"
                : language === "hi"
                ? "हिन्दी"
                : language === "ur"
                ? "اردو"
                : "English"}
            </span>
          </div>

          {!isSupported && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{t("voice.unsupported")}</span>
            </div>
          )}

          {/* Central Microphone Button & Pulse Animation */}
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <div className="relative">
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
              )}
              {isSpeaking && (
                <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-50" />
              )}
              <button
                onClick={isListening ? stopListening : startListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                  isListening
                    ? "bg-red-600 text-white hover:bg-red-700 ring-4 ring-red-200"
                    : isSpeaking
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 ring-4 ring-indigo-200"
                    : "bg-[#4F46E5] text-white hover:bg-[#4338CA] hover:scale-105"
                }`}
                title={isListening ? t("voice.stopListening") : t("voice.startListening")}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : isSpeaking ? (
                  <Volume2 className="w-8 h-8 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <div className="text-center">
              <span className="text-xs font-semibold text-[#17213F] block">
                {isListening
                  ? t("voice.listening")
                  : isSpeaking
                  ? t("voice.speaking")
                  : t("voice.startListening")}
              </span>
              <span className="text-[11px] text-[#667085]">
                {isListening
                  ? "Listening to microphone input..."
                  : "Click microphone or use text input below"}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Transcript & Response Area */}
          {(transcript || assistantResponse) && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              {transcript && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    {t("voice.transcript")}
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">&ldquo;{transcript}&rdquo;</p>
                </div>
              )}
              {assistantResponse && (
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#4F46E5]">
                      {t("voice.response")}
                    </span>
                    <button
                      onClick={() => (isSpeaking ? stopSpeaking() : speakText(assistantResponse))}
                      className="inline-flex items-center gap-1 text-[11px] text-[#4F46E5] font-semibold hover:underline cursor-pointer"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>{t("voice.stopSpeaking")}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{t("voice.readAloud")}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-800 leading-relaxed mt-1">{assistantResponse}</p>
                </div>
              )}
            </div>
          )}

          {/* Suggested Prompts */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t("voice.suggested")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: t("voice.promptSchemes"), text: "Show all schemes" },
                { label: t("voice.promptRescue"), text: "Open Rescue Mode" },
                { label: t("voice.promptUpdates"), text: "Check scheme updates" },
                { label: t("voice.promptKisan"), text: "What is PM-KISAN?" },
              ].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(s.text);
                    processQuery(s.text);
                  }}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-[#4F46E5] border border-gray-200 transition-colors text-gray-700 cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: Typing Fallback */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/70">
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t("voice.typingFallback")}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-[#17213F]"
              />
            </div>
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>{t("voice.sendText")}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
