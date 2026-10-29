/**
 * BizVoice Client REST API
 * 100% Self-Hosted, Zero-API-Key Local Voice Engine
 * Base URL: http://localhost:8000
 */

export const BIZVOICE_REST_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_BIZVOICE_API_URL) ||
  "http://localhost:8000";

export interface StartCallSessionParams {
  agent_id?: string | null;
  custom_system_prompt?: string;
  voice?: string;
}

export interface StartCallSessionResponse {
  session_id: string;
  call_id: string;
  ws_url: string;
}

export interface SendSupplierEnquiryParams {
  supplier_name: string;
  supplier_email: string;
  items_description: string;
  language: "mr" | "hi" | "gu" | "ta" | "en"; // mr = Marathi, hi = Hindi, gu = Gujarati, ta = Tamil, en = English
  custom_voice_script?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
}

export interface SupplierEnquiryResponse {
  status: string;
  email_sent: boolean;
  smtp_message?: string | null;
  supplier_email: string;
  supplier_name: string;
  language: string;
  language_name: string;
  voice_used: string;
  email_body: string;
  voice_script: string;
  audio_file: string;
  audio_url: string;
  created_at: string;
}

export interface BizVoiceHealth {
  status: "healthy" | "degraded" | "offline";
  ollama_reachable: boolean;
  stt_status: { loaded: boolean; error?: string | null };
  tts_status: { loaded: boolean; error?: string | null };
  vad_status: { loaded: boolean; error?: string | null };
  active_sessions_count: number;
}

/**
 * Initialize a new voice session with the local BizVoice server
 */
export async function startBizVoiceSession(
  params: StartCallSessionParams = {}
): Promise<StartCallSessionResponse> {
  const response = await fetch(`${BIZVOICE_REST_URL}/api/calls/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: params.agent_id || "default",
      custom_system_prompt:
        params.custom_system_prompt ||
        "You are Bizora AI, an intelligent, polite, and helpful voice assistant for our store.",
      voice: params.voice || "af_heart",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `BizVoice server returned HTTP ${response.status}: ${errorText || "Could not start session"}`
    );
  }

  return await response.json();
}

/**
 * Dispatch an order enquiry email to a supplier with attached local .wav voice note
 * Supports regional Asian/Indian languages (Marathi mr, Hindi hi, Gujarati gu, Tamil ta, English en)
 */
export async function sendSupplierEnquiry(
  params: SendSupplierEnquiryParams
): Promise<SupplierEnquiryResponse> {
  const response = await fetch(`${BIZVOICE_REST_URL}/api/suppliers/email-with-voicenote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `BizVoice supplier email failed [${response.status}]: ${errorText || "Server error"}`
    );
  }

  const data = await response.json();
  // Ensure absolute audio URL for playback in browser
  if (data.audio_url && !data.audio_url.startsWith("http")) {
    data.audio_url = `${BIZVOICE_REST_URL}${data.audio_url}`;
  }
  return data;
}

/**
 * Check if the local BizVoice FastAPI server & AI engines are healthy
 */
export async function checkBizVoiceHealth(): Promise<BizVoiceHealth> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${BIZVOICE_REST_URL}/api/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      return await response.json();
    }
    return {
      status: "degraded",
      ollama_reachable: false,
      stt_status: { loaded: false, error: `HTTP ${response.status}` },
      tts_status: { loaded: false, error: null },
      vad_status: { loaded: false, error: null },
      active_sessions_count: 0,
    };
  } catch (err: any) {
    return {
      status: "offline",
      ollama_reachable: false,
      stt_status: { loaded: false, error: err?.message || "BizVoice offline" },
      tts_status: { loaded: false, error: null },
      vad_status: { loaded: false, error: null },
      active_sessions_count: 0,
    };
  }
}

/**
 * Return available voices from Kokoro TTS
 */
export async function getBizVoiceVoices(): Promise<string[]> {
  try {
    const res = await fetch(`${BIZVOICE_REST_URL}/api/voices`);
    if (res.ok) return await res.json();
    return ["af_heart", "af_bella", "am_adam", "am_michael", "bf_emma"];
  } catch {
    return ["af_heart", "af_bella", "am_adam", "am_michael", "bf_emma"];
  }
}
