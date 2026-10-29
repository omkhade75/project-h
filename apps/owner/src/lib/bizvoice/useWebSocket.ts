import { useState, useRef, useCallback, useEffect } from "react";

export type CallState = "idle" | "listening" | "thinking" | "speaking";

export interface UseWebSocketOptions {
  onAudioReceived?: (data: ArrayBuffer) => void;
  onTranscript?: (role: "user" | "assistant", text: string, isFinal: boolean) => void;
  onStateChange?: (state: CallState) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export function useWebSocket({
  onAudioReceived,
  onTranscript,
  onStateChange,
  onError,
  onClose,
}: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(
    (sessionId: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }

      setIsConnecting(true);

      const envWsUrl =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_BIZVOICE_WS_URL) || "";

      let wsUrl = "";
      if (envWsUrl) {
        const clean = envWsUrl.replace(/\/+$/, "");
        wsUrl = `${clean}/ws/call/${sessionId}`;
      } else {
        // Default local BizVoice server
        const wsProtocol =
          typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = "localhost:8000";
        wsUrl = `${wsProtocol}//${wsHost}/ws/call/${sessionId}`;
      }

      try {
        const ws = new WebSocket(wsUrl);
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setIsConnecting(false);
          console.log("[BizVoice WS] Connected to", wsUrl);
        };

        ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            // Raw PCM 24kHz audio from Kokoro TTS
            if (onAudioReceived) {
              onAudioReceived(event.data);
            }
          } else if (typeof event.data === "string") {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "transcript") {
                if (onTranscript) {
                  onTranscript(data.role, data.text, data.is_final ?? true);
                }
              } else if (data.type === "state") {
                if (onStateChange) {
                  onStateChange(data.state as CallState);
                }
              } else if (data.type === "error") {
                if (onError) {
                  onError(data.message || "An error occurred on the BizVoice engine.");
                }
              }
            } catch (err) {
              console.error("[BizVoice WS] Failed to parse message:", err);
            }
          }
        };

        ws.onerror = (event) => {
          console.error("[BizVoice WS] Error event:", event);
          if (onError) onError("Failed to connect to local BizVoice engine (ws://localhost:8000)");
        };

        ws.onclose = () => {
          setIsConnected(false);
          setIsConnecting(false);
          wsRef.current = null;
          if (onClose) onClose();
        };
      } catch (err: unknown) {
        setIsConnecting(false);
        const msg = err instanceof Error ? err.message : "Failed to open BizVoice WebSocket";
        if (onError) onError(msg);
      }
    },
    [onAudioReceived, onTranscript, onStateChange, onError, onClose]
  );

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "end" }));
        }
      } catch {}
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendAudio = useCallback((buffer: ArrayBuffer) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(buffer);
    }
  }, []);

  const sendJson = useCallback((data: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const toggleMute = useCallback(
    (muted: boolean) => {
      sendJson({ type: "mute", value: muted });
    },
    [sendJson]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendAudio,
    sendJson,
    toggleMute,
  };
}
