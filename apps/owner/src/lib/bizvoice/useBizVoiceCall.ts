import { useState, useRef, useCallback, useEffect } from "react";
import { useAudio } from "./useAudio";
import { useWebSocket, CallState } from "./useWebSocket";
import { startBizVoiceSession } from "./bizvoice-api";

export interface TranscriptItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export interface StartCallOptions {
  agentId?: string;
  customSystemPrompt?: string;
  voice?: string;
}

export function useBizVoiceCall() {
  const [isInCall, setIsInCall] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [userLevel, setUserLevel] = useState(0);
  const [assistantLevel, setAssistantLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleAudioReceived = useCallback((data: ArrayBuffer) => {
    audio.playPcmChunk(data);
  }, []);

  const handleTranscript = useCallback((role: "user" | "assistant", text: string) => {
    setTranscript((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        role,
        text,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleStateChange = useCallback((state: CallState) => {
    setCallState(state);
    if (state === "listening") {
      audio.stopPlayback();
    }
  }, []);

  const ws = useWebSocket({
    onAudioReceived: handleAudioReceived,
    onTranscript: handleTranscript,
    onStateChange: handleStateChange,
    onError: (err) => setError(err),
    onClose: () => {
      endCall();
    },
  });

  const audio = useAudio({
    onAudioData: (pcmBuffer) => {
      if (!isMuted && ws.isConnected) {
        ws.sendAudio(pcmBuffer);
      }
    },
    onUserLevel: (level) => {
      if (!isMuted) setUserLevel(level);
    },
    onAssistantLevel: (level) => {
      setAssistantLevel(level);
    },
  });

  const startCall = useCallback(
    async (options: StartCallOptions = {}) => {
      try {
        setError(null);
        setTranscript([]);
        setDuration(0);

        // 1. Initialize session on local BizVoice server
        const session = await startBizVoiceSession({
          agent_id: options.agentId || "default",
          custom_system_prompt: options.customSystemPrompt,
          voice: options.voice,
        });

        // 2. Connect WebSocket to ws://localhost:8000/ws/call/{sessionId}
        ws.connect(session.session_id);

        // 3. Start microphone capture (16kHz PCM)
        await audio.startCapture();

        setIsInCall(true);
        setCallState("listening");

        // 4. Start duration timer
        if (durationTimerRef.current) clearInterval(durationTimerRef.current);
        durationTimerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to start BizVoice call";
        setError(msg);
        console.error("[BizVoice Call] Start error:", err);
      }
    },
    [ws, audio]
  );

  const endCall = useCallback(() => {
    audio.stopCapture();
    audio.stopPlayback();
    ws.disconnect();

    setIsInCall(false);
    setCallState("idle");
    setUserLevel(0);
    setAssistantLevel(0);

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, [audio, ws]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      ws.toggleMute(next);
      if (next) setUserLevel(0);
      return next;
    });
  }, [ws]);

  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  return {
    isInCall,
    callState,
    isMuted,
    userLevel,
    assistantLevel,
    transcript,
    duration,
    error,
    startCall,
    endCall,
    toggleMute,
  };
}
