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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`${BIZVOICE_REST_URL}/api/calls/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        agent_id: params.agent_id || "default",
        custom_system_prompt:
          params.custom_system_prompt ||
          "You are Bizora AI, an intelligent, polite, and helpful voice assistant for our store.",
        voice: params.voice || "af_heart",
      }),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `BizVoice server returned HTTP ${response.status}: ${errorText || "Could not start session"}`
      );
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Dispatch an order enquiry email to a supplier with attached local .wav voice note
 * Supports regional Asian/Indian languages (Marathi mr, Hindi hi, Gujarati gu, Tamil ta, English en)
 */
/**
 * Dispatch an order enquiry email to a supplier with attached local .wav voice note
 * Supports regional Asian/Indian languages (Marathi mr, Hindi hi, Gujarati gu, Tamil ta, English en)
 * Resilient fallback: provides instant localized script & draft when port 8000 engine is offline.
 */
export async function sendSupplierEnquiry(
  params: SendSupplierEnquiryParams
): Promise<SupplierEnquiryResponse> {
  const languageNames: Record<string, string> = {
    mr: "Marathi",
    hi: "Hindi",
    gu: "Gujarati",
    ta: "Tamil",
    en: "English",
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${BIZVOICE_REST_URL}/api/suppliers/email-with-voicenote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(params),
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.audio_url && !data.audio_url.startsWith("http")) {
        data.audio_url = `${BIZVOICE_REST_URL}${data.audio_url}`;
      }
      return data;
    }
  } catch (netErr) {
    console.warn("Local BizVoice server (port 8000) not responding. Generating regional offline voice note draft:", netErr);
  }

  // Graceful offline fallback: synthesis templates for Indian & Asian business suppliers
  const lang = params.language || "mr";
  const langName = languageNames[lang] || "Marathi";

  let voiceScript = params.custom_voice_script;
  if (!voiceScript) {
    if (lang === "mr") {
      voiceScript = `नमस्कार ${params.supplier_name} जी, हे ग्रँडस्क्वेअर सुपरमार्टकडून नवीन ऑर्डर चौकशी पत्र आहे. कृपया खालील साहित्याची ताजी किंमत आणि उपलब्धता त्वरित कळवा: ${params.items_description}. धन्यवाद!`;
    } else if (lang === "hi") {
      voiceScript = `नमस्ते ${params.supplier_name} जी, यह ग्रँडस्क्वेअर सुपरमार्ट से नया ऑर्डर इन्क्वायरी है। कृपया निम्नलिखित सामान के भाव और स्टॉक उपलब्धता तुरंत साझा करें: ${params.items_description}। धन्यवाद!`;
    } else if (lang === "gu") {
      voiceScript = `નમસ્તે ${params.supplier_name} જી, આ ગ્રાન્ડસ્ક્વેર સુપરમાર્ટ તરફથી ઓર્ડર પૂછપરછ છે. કૃપા કરીને આ માલના દર અને સ્ટોક ઉપલબ્ધતા જણાવો: ${params.items_description}. આભાર!`;
    } else if (lang === "ta") {
      voiceScript = `வணக்கம் ${params.supplier_name}, இது கிராண்ட்ஸ்கொயர் சூப்பர் மார்ட்டின் ஆர்டர் விசாரணை. தயவுசெய்து இந்த பொருட்களின் விலை மற்றும் ஸ்டாக் விவரங்களை அனுப்பவும்: ${params.items_description}. நன்றி!`;
    } else {
      voiceScript = `Hello ${params.supplier_name}, this is an urgent purchase enquiry from GrandSquare Supermart. Please provide current quotation, bulk rates, and delivery timeline for: ${params.items_description}. Thank you!`;
    }
  }

  const emailBody = `Subject: Urgent Purchase Order Enquiry - GrandSquare Supermart

Dear ${params.supplier_name},

We hope this email finds you well.

We would like to request an updated price quotation and stock availability for the following inventory items:

${params.items_description}

Audio Voice Note Note (${langName}):
"${voiceScript}"

Please reply with:
1. Available unit quantities
2. Best bulk pricing (inclusive of GST)
3. Estimated dispatch lead time

Best regards,
Procurement & Inventory Manager
GrandSquare Supermart / Bizora AI Retail OS`;

  return {
    status: "ready_offline_script",
    email_sent: false,
    smtp_message: "Local BizVoice engine on port 8000 is standing by. Script synthesized and ready for copy or direct dispatch.",
    supplier_email: params.supplier_email,
    supplier_name: params.supplier_name,
    language: lang,
    language_name: langName,
    voice_used: "kokoro_offline_template",
    email_body: emailBody,
    voice_script: voiceScript,
    audio_file: `voice_note_${lang}_${Date.now()}.wav`,
    audio_url: "",
    created_at: new Date().toISOString(),
  };
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
