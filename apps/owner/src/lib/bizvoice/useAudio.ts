import { useRef, useState, useCallback, useEffect } from "react";

export interface UseAudioOptions {
  onAudioData?: (data: ArrayBuffer) => void;
  onUserLevel?: (level: number) => void;
  onAssistantLevel?: (level: number) => void;
}

export function useAudio({ onAudioData, onUserLevel, onAssistantLevel }: UseAudioOptions = {}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  // Initialize or resume AudioContext
  const ensureAudioContext = useCallback(async () => {
    if (typeof window === "undefined") return null;

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = ctx;
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Start microphone capture via AudioWorklet (16kHz PCM mono)
  const startCapture = useCallback(async () => {
    try {
      setError(null);
      const ctx = await ensureAudioContext();
      if (!ctx) return;

      // Load custom audio worklet from public/audio-worklet.js
      await ctx.audioWorklet.addModule("/audio-worklet.js");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const sourceNode = ctx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(ctx, "audio-capture-processor");
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event) => {
        if (event.data.type === "audio") {
          if (onAudioData) {
            onAudioData(event.data.pcmData);
          }
          if (onUserLevel) {
            onUserLevel(Math.min(1, event.data.level * 4));
          }
        }
      };

      sourceNode.connect(workletNode);

      // Connect to destination via silent gain to avoid feedback loop
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      workletNode.connect(silentGain);
      silentGain.connect(ctx.destination);

      setIsCapturing(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to access microphone";
      setError(msg);
      console.error("[BizVoice Audio] Error starting capture:", err);
    }
  }, [ensureAudioContext, onAudioData, onUserLevel]);

  // Stop microphone capture
  const stopCapture = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (workletNodeRef.current) {
      try {
        workletNodeRef.current.disconnect();
      } catch {}
      workletNodeRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  // Play PCM 16-bit 24kHz audio from local BizVoice Kokoro engine
  const playPcmChunk = useCallback(
    async (pcmData: ArrayBuffer) => {
      try {
        const ctx = await ensureAudioContext();
        if (!ctx) return;

        const int16Array = new Int16Array(pcmData);
        if (int16Array.length === 0) return;

        // Convert int16 to float32
        const float32Array = new Float32Array(int16Array.length);
        let sumSquares = 0;
        for (let i = 0; i < int16Array.length; i++) {
          const sample = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
          float32Array[i] = sample;
          sumSquares += sample * sample;
        }

        const rms = Math.sqrt(sumSquares / int16Array.length);
        if (onAssistantLevel) {
          onAssistantLevel(Math.min(1, rms * 4));
        }

        // Kokoro outputs 24000Hz mono PCM
        const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        const currentTime = ctx.currentTime;
        const startTime = Math.max(currentTime, nextPlayTimeRef.current);
        source.start(startTime);
        nextPlayTimeRef.current = startTime + audioBuffer.duration;

        setIsPlaying(true);
        source.onended = () => {
          if (ctx.currentTime >= nextPlayTimeRef.current - 0.05) {
            setIsPlaying(false);
            if (onAssistantLevel) onAssistantLevel(0);
          }
        };
      } catch (err) {
        console.error("[BizVoice Audio] Error playing PCM chunk:", err);
      }
    },
    [ensureAudioContext, onAssistantLevel]
  );

  // Clear audio queue immediately (for barge-in / interruption)
  const stopPlayback = useCallback(() => {
    if (audioContextRef.current) {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
    setIsPlaying(false);
    if (onAssistantLevel) onAssistantLevel(0);
  }, [onAssistantLevel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stopCapture]);

  return {
    isCapturing,
    isPlaying,
    error,
    startCapture,
    stopCapture,
    playPcmChunk,
    stopPlayback,
  };
}
