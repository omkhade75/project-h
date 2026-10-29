import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  timestamp: string;
}

export type VoiceState = "idle" | "speaking" | "listening" | "thinking";
export type VoiceCallStatus = "idle" | "connecting" | "active" | "ended";

export interface UseAutonomousVoiceOptions {
  onCallEnd?: () => void;
}

export function useAutonomousVoice(options: UseAutonomousVoiceOptions = {}) {
  const [callStatus, setCallStatus] = useState<VoiceCallStatus>("idle");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [duration, setDuration] = useState(0);
  const [transcripts, setTranscripts] = useState<VoiceMessage[]>([]);
  const [userLevel, setUserLevel] = useState(0);
  const [assistantLevel, setAssistantLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [recipientName, setRecipientName] = useState("");

  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelAnimTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Pre-load / warm-up browser voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      };
    }
  }, []);

  // Format timestamp helper
  const nowTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  // Find best Indian/Hindi or natural English voice
  const selectVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Prefer Hindi voice
    const hindiVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith("hi") ||
        v.name.toLowerCase().includes("hindi") ||
        v.name.toLowerCase().includes("swara") ||
        v.name.toLowerCase().includes("madhur")
    );
    if (hindiVoice) return hindiVoice;

    // 2. Prefer Indian English voice
    const indianVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().includes("en-in") ||
        v.name.toLowerCase().includes("india") ||
        v.name.toLowerCase().includes("neerja") ||
        v.name.toLowerCase().includes("prabhat")
    );
    if (indianVoice) return indianVoice;

    // 3. Fallback to any natural English voice
    const defaultVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith("en") && !v.name.toLowerCase().includes("compact")
    );
    return defaultVoice || voices[0] || null;
  };

  // Animate audio waveform levels
  const startLevelAnimation = (mode: "assistant" | "user") => {
    if (levelAnimTimerRef.current) clearInterval(levelAnimTimerRef.current);

    levelAnimTimerRef.current = setInterval(() => {
      if (mode === "assistant") {
        setUserLevel(0.04 + Math.random() * 0.06);
        setAssistantLevel(0.45 + Math.random() * 0.5);
      } else {
        setAssistantLevel(0.03 + Math.random() * 0.05);
        if (!isMutedRef.current) {
          setUserLevel(0.25 + Math.random() * 0.55);
        } else {
          setUserLevel(0);
        }
      }
    }, 90);
  };

  const stopLevelAnimation = () => {
    if (levelAnimTimerRef.current) {
      clearInterval(levelAnimTimerRef.current);
      levelAnimTimerRef.current = null;
    }
    setUserLevel(0);
    setAssistantLevel(0);
  };

  // Speak AI message using browser SpeechSynthesis
  const speakAi = useCallback(
    (text: string, onCompleted?: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        if (onCompleted) onCompleted();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        // Crucial for Chrome: resume synthesis queue if paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        setVoiceState("speaking");
        startLevelAnimation("assistant");

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = selectVoice();
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang || "hi-IN";
        } else {
          utterance.lang = "hi-IN";
        }
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          stopLevelAnimation();
          setVoiceState("listening");
          startListeningForUser();
          if (onCompleted) onCompleted();
        };

        utterance.onerror = (e) => {
          console.warn("[Voice] Speech synthesis utterance error:", e);
          stopLevelAnimation();
          setVoiceState("listening");
          startListeningForUser();
          if (onCompleted) onCompleted();
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[Voice] Speech synthesis failed to speak:", err);
        setVoiceState("listening");
        startListeningForUser();
        if (onCompleted) onCompleted();
      }
    },
    []
  );

  // Generate contextual, intelligent Indian retail response
  const generateStoreReply = (userInput: string, customer: string): string => {
    const input = userInput.toLowerCase();

    if (
      input.includes("discount") ||
      input.includes("offer") ||
      input.includes("kitna") ||
      input.includes("chhoot") ||
      input.includes("price") ||
      input.includes("kam")
    ) {
      return `Haan bilkul ${customer}! Aapko GrandSquare Supermart se flat 15% VIP discount diya ja raha hai. Coupon code 'BIZORA15' se aapke pure bill par instant discount lag jayega!`;
    }

    if (
      input.includes("delivery") ||
      input.includes("kab") ||
      input.includes("time") ||
      input.includes("pahunch") ||
      input.includes("bhejo")
    ) {
      return `Ji bilkul! Hamara express delivery partner agle 10 se 15 minute ke andar aapke doorstep par delivery deliver kar dega!`;
    }

    if (
      input.includes("confirm") ||
      input.includes("haan") ||
      input.includes("theek") ||
      input.includes("order") ||
      input.includes("bhejo") ||
      input.includes("yes") ||
      input.includes("ok")
    ) {
      return `Shukriya ${customer}! Aapka order confirm kar diya gaya hai. Receipt aur tracking update aapke WhatsApp par turant bhej di gayi hai. GrandSquare Supermart chune ke liye dhanyavaad!`;
    }

    if (
      input.includes("whatsapp") ||
      input.includes("message") ||
      input.includes("msg") ||
      input.includes("link")
    ) {
      return `Ji zaroor! Maine aapke mobile number par WhatsApp message aur special 15% discount link abhi bhej diya hai.`;
    }

    // Default polite response
    return `Ji bilkul ${customer}! Maine aapki baat note kar li hai. Hamare store manager turant aapki seva mein hazir hain! Aur koi sahayata chahiye?`;
  };

  // Start listening for customer speech via browser SpeechRecognition
  const startListeningForUser = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Browser doesn't support mic recognition, keep active and show chips
      setVoiceState("listening");
      startLevelAnimation("user");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setVoiceState("listening");
        startLevelAnimation("user");
      };

      recognition.onresult = (event: any) => {
        const heard = event.results?.[0]?.[0]?.transcript?.trim();
        if (heard && !isMutedRef.current) {
          sendUserSpeech(heard);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          console.warn("[Voice] Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        // If still active and not speaking, maintain listening animation
        if (callStatus === "active" && voiceState === "listening") {
          startLevelAnimation("user");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("[Voice] Speech recognition start error:", err);
      setVoiceState("listening");
      startLevelAnimation("user");
    }
  }, [callStatus, voiceState]);

  // Handle incoming user speech (from mic or interactive quick chip)
  const sendUserSpeech = useCallback(
    (text: string) => {
      if (!text.trim() || callStatus !== "active") return;

      const userMsg: VoiceMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        text: text.trim(),
        timestamp: nowTime(),
      };

      setTranscripts((prev) => [...prev, userMsg]);
      setVoiceState("thinking");
      stopLevelAnimation();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }

      setTimeout(() => {
        const replyText = generateStoreReply(text, recipientName || "Customer");
        const aiMsg: VoiceMessage = {
          id: `ai_${Date.now()}`,
          role: "assistant",
          text: replyText,
          timestamp: nowTime(),
        };
        setTranscripts((prev) => [...prev, aiMsg]);
        speakAi(replyText);
      }, 450);
    },
    [callStatus, recipientName, speakAi]
  );

  // Start Call
  const startCall = useCallback(
    (name: string, scriptText: string) => {
      // 1. Resume audio context & SpeechSynthesis immediately on user click gesture
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
        } catch (_) {}
      }

      setRecipientName(name);
      setCallStatus("active");
      setVoiceState("speaking");
      setDuration(0);

      const openingText =
        scriptText.trim() ||
        `Namaste ${name}! GrandSquare Supermart se aap ke liye special 15% discount offer tayyar hai.`;

      const initialMessage: VoiceMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        text: openingText,
        timestamp: nowTime(),
      };
      setTranscripts([initialMessage]);

      // 2. Start duration timer (guaranteed 1-second ticks)
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      durationTimerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // 3. Speak opening out loud
      speakAi(openingText);
    },
    [speakAi]
  );

  // End Call
  const endCall = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (_) {}
    }

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    stopLevelAnimation();
    setCallStatus("ended");
    setVoiceState("idle");

    if (options.onCallEnd) {
      options.onCallEnd();
    }

    setTimeout(() => {
      setCallStatus("idle");
    }, 1200);
  }, [options]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        setUserLevel(0);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (_) {}
        }
      } else {
        if (callStatus === "active" && voiceState === "listening") {
          startListeningForUser();
        }
      }
      return next;
    });
  }, [callStatus, voiceState, startListeningForUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (levelAnimTimerRef.current) clearInterval(levelAnimTimerRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  return {
    callStatus,
    voiceState,
    duration,
    transcripts,
    userLevel,
    assistantLevel,
    isMuted,
    startCall,
    endCall,
    sendUserSpeech,
    toggleMute,
  };
}
