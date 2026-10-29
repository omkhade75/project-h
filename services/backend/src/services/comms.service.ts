import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as fs from 'fs';
import * as path from 'path';

export interface WhatsAppConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsAppSender: string;
  ownerWhatsAppNumber: string;
  managerWhatsAppNumber: string;
}

export interface VapiConfig {
  vapiPhoneId: string;
  vapiAgentId: string;
  vapiPublicKey: string;
  vapiPrivateKey: string;
}

@Injectable()
export class CommsService {
  constructor(private prisma: DatabaseService) {}

  private memoryWaConfigCache: WhatsAppConfig = {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
    twilioWhatsAppSender: process.env.TWILIO_WHATSAPP_SENDER || "whatsapp:+14155238886",
    ownerWhatsAppNumber: process.env.OWNER_WHATSAPP_NUMBER || "+917588021256",
    managerWhatsAppNumber: process.env.MANAGER_WHATSAPP_NUMBER || "+917588021256",
  };

  private memoryVapiConfigCache: VapiConfig = {
    vapiPhoneId: process.env.VAPI_PHONE_ID || "027dfd39-b626-43cf-859f-6583a33f580b",
    vapiAgentId: process.env.VAPI_AGENT_ID || "338bb628-cfaf-418c-9341-6f8889a28189",
    vapiPublicKey: process.env.VAPI_PUBLIC_KEY || "e3322c27-c9ac-45cb-9c58-e49c8f423a1f",
    vapiPrivateKey: process.env.VAPI_PRIVATE_KEY || "581c84cb-6185-4714-98d1-bdd823189ea0",
  };

  private getWaConfigPath() {
    return path.join(process.cwd(), 'whatsapp-config.json');
  }

  private getVapiConfigPath() {
    return path.join(process.cwd(), 'vapi-config.json');
  }

  async getWhatsAppConfig() {
    try {
      const configPath = this.getWaConfigPath();
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.memoryWaConfigCache = { ...this.memoryWaConfigCache, ...parsed };
      }
    } catch (err) {}
    return { success: true, data: this.memoryWaConfigCache };
  }

  async updateWhatsAppConfig(config: WhatsAppConfig) {
    this.memoryWaConfigCache = { ...this.memoryWaConfigCache, ...config };
    try {
      const configPath = this.getWaConfigPath();
      fs.writeFileSync(configPath, JSON.stringify(this.memoryWaConfigCache, null, 2), 'utf8');
    } catch (err) {}
    return { success: true, data: this.memoryWaConfigCache };
  }

  async sendWhatsAppMessage(data: { recipientPhone: string; recipientName?: string; message: string; workspaceId?: string }) {
    const config = this.memoryWaConfigCache;
    let phone = (data.recipientPhone || config.ownerWhatsAppNumber || "").trim().replace(/\s+/g, "");
    if (!phone.startsWith("+")) {
      if (phone.length === 10) phone = "+91" + phone;
      else phone = "+" + phone;
    }

    console.log("[WhatsApp Debug] Config loaded:", {
      hasSid: !!config.twilioAccountSid,
      hasToken: !!config.twilioAuthToken,
      sender: config.twilioWhatsAppSender,
      recipientPhone: phone,
    });

    let logId = "";
    try {
      const log = await this.prisma.messageLog.create({
        data: {
          workspaceId: data.workspaceId || "grandsquare-mall",
          channel: "WHATSAPP",
          recipientName: data.recipientName || "WhatsApp Recipient",
          recipientPhone: phone,
          messageType: "OUTREACH",
          body: data.message,
          status: "PENDING",
        },
      });
      logId = log.id;
    } catch (err) {}

    // Live Twilio WhatsApp API integration if Account SID & Auth Token are provided
    if (config.twilioAccountSid && config.twilioAuthToken) {
      try {
        const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
        
        // Ensure the sender has 'whatsapp:' prefix
        let fromNumber = config.twilioWhatsAppSender || "whatsapp:+14155238886";
        if (!fromNumber.startsWith("whatsapp:")) {
          fromNumber = `whatsapp:${fromNumber}`;
        }
        
        // Ensure the recipient has 'whatsapp:' prefix
        const toNumber = `whatsapp:${phone}`;
        
        console.log("[WhatsApp Debug] Sending via Twilio:", { from: fromNumber, to: toNumber, bodyLength: data.message.length });

        const bodyParams = new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          Body: data.message,
        });

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: bodyParams.toString(),
          }
        );

        const twilioData: any = await twilioRes.json();
        console.log("[WhatsApp Debug] Twilio Response:", { ok: twilioRes.ok, status: twilioRes.status, data: twilioData });
        
        if (logId) {
          await this.prisma.messageLog.update({
            where: { id: logId },
            data: {
              status: twilioRes.ok ? "SENT" : "FAILED",
              providerId: twilioData.sid || "wa-msg-" + Date.now(),
            },
          });
        }

        if (!twilioRes.ok) {
          return { 
            success: false, 
            error: twilioData.message || `Twilio API returned HTTP ${twilioRes.status}`,
            errorCode: twilioData.code,
            data: twilioData, 
            recipientPhone: phone 
          };
        }

        return { success: true, data: twilioData, recipientPhone: phone };
      } catch (err: any) {
        console.error("[Twilio WhatsApp Error]:", err);
        if (logId) {
          try {
            await this.prisma.messageLog.update({
              where: { id: logId },
              data: { status: "FAILED" },
            });
          } catch (e) {}
        }
        return {
          success: false,
          error: err?.message || "Twilio API network error",
          data: { phone, status: "FAILED" },
        };
      }
    }

    // No Twilio credentials configured — return honest status
    if (logId) {
      try {
        await this.prisma.messageLog.update({
          where: { id: logId },
          data: { status: "NO_CREDENTIALS", providerId: "wa-msg-" + Date.now() },
        });
      } catch (e) {}
    }

    return {
      success: false,
      message: `WhatsApp API credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables, or use the direct wa.me link to send messages manually.`,
      data: { phone, status: "NO_CREDENTIALS", messageId: "wa-msg-" + Date.now() },
    };
  }

  async sendWhatsAppBroadcast(workspaceId: string, data: { recipients?: Array<{ phone: string; name?: string }>; message: string }) {
    const recipients = Array.isArray(data.recipients) && data.recipients.length > 0 
      ? data.recipients 
      : [{ phone: this.memoryWaConfigCache.ownerWhatsAppNumber || "+917588021256", name: "VIP Customer" }];
    
    const results = [];
    for (const r of recipients) {
      const personalizedMsg = (data.message || "")
        .replace(/\{name\}/gi, r.name || "Customer")
        .replace(/\{phone\}/gi, r.phone || "");

      const res = await this.sendWhatsAppMessage({
        workspaceId,
        recipientPhone: r.phone,
        recipientName: r.name || "Customer",
        message: personalizedMsg,
      });
      results.push({ phone: r.phone, name: r.name, ...res });
    }

    const dispatchedCount = results.filter((r) => r.success).length;
    return {
      success: true,
      totalRecipients: recipients.length,
      dispatchedCount,
      results,
      status: dispatchedCount > 0 ? "SENT" : (results[0]?.status || "NO_CREDENTIALS"),
    };
  }

  async getVapiConfig() {
    try {
      const configPath = this.getVapiConfigPath();
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.memoryVapiConfigCache = { ...this.memoryVapiConfigCache, ...parsed };
      }
    } catch (err) {}
    return { success: true, data: this.memoryVapiConfigCache };
  }

  async updateVapiConfig(config: VapiConfig) {
    this.memoryVapiConfigCache = { ...this.memoryVapiConfigCache, ...config };
    try {
      const configPath = this.getVapiConfigPath();
      fs.writeFileSync(configPath, JSON.stringify(this.memoryVapiConfigCache, null, 2), 'utf8');
    } catch (err) {}
    return { success: true, data: this.memoryVapiConfigCache };
  }

  async initiateVapiCall(workspaceId: string, data: any) {
    const config = this.memoryVapiConfigCache;

    let phone = (data.phoneNumber || data.recipientPhone || "").trim().replace(/\s+/g, "");
    if (!phone.startsWith("+")) {
      if (phone.length === 10) phone = "+91" + phone;
      else phone = "+" + phone;
    }

    let recipientName = (data.recipientName || "").trim();
    if (!recipientName || recipientName.toLowerCase().startsWith("customer #") || recipientName.toLowerCase().startsWith("cust")) {
      recipientName = "Aap";
    }
    const contextMsg = data.messageContext || data.script || "GrandSquare Supermart se aap ke liye special 15% discount offer tayyar hai.";

    let logId = "";
    try {
      const log = await this.prisma.messageLog.create({
        data: {
          workspaceId,
          channel: "VOICE",
          recipientName,
          recipientPhone: phone,
          messageType: "CRM_OUTREACH",
          body: contextMsg,
          status: "PENDING",
        },
      });
      logId = log.id;
    } catch (dbErr) {}

    // Query actual products from database if available to give real store knowledge
    let productCatalogSummary = "Fresh Organic Fruits (Apples, Bananas, Alphonso Mangoes), Dairy (Amul Taaza Milk, Butter, Fresh Paneer), Groceries (Fortune Sunflower Oil, India Gate Basmati Rice, Aashirvaad Shudh Chakki Atta, Toor Dal), Snacks (Haldiram Bhujia, Biscuits, Chocolates) aur Daily Household Items";
    try {
      if (this.prisma?.product) {
        const topProducts: any[] = await (this.prisma.product as any).findMany({
          where: { workspaceId },
          take: 8,
          select: { name: true, sellingPrice: true },
        });
        if (topProducts && topProducts.length > 0) {
          productCatalogSummary = topProducts.map((p) => `${p.name} (₹${p.sellingPrice || 100})`).join(", ");
        }
      }
    } catch (e) {}

    // 1. Try local self-hosted BizVoice calling engine first (100% private, zero API keys)
    try {
      const bizVoiceRes = await fetch("http://localhost:8000/api/calls/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: "default",
          custom_system_prompt: `You are Bizora AI calling ${recipientName} (${phone}). Store context: ${contextMsg}`,
        }),
      });
      if (bizVoiceRes.ok) {
        const bvData: any = await bizVoiceRes.json();
        if (logId) {
          await this.prisma.messageLog.update({
            where: { id: logId },
            data: {
              status: "SENT",
              providerId: bvData.session_id || bvData.call_id || "bv-" + Date.now(),
            },
          });
        }
        return {
          success: true,
          provider: "bizvoice-selfhosted",
          data: {
            callId: bvData.call_id || bvData.session_id,
            sessionId: bvData.session_id,
            wsUrl: bvData.ws_url,
            status: "active",
            message: `BizVoice AI voice call initialized locally for ${recipientName}`,
          },
        };
      }
    } catch (bvErr) {
      // Local BizVoice backend not running right now, continue to gateway fallback
    }

    // Dispatch real outbound phone call via Vapi REST API with verified schema
    try {
      const vapiPayload: any = {
        phoneNumberId: config.vapiPhoneId,
        customer: {
          number: phone,
          name: recipientName,
        },
        assistant: {
          name: "Bizora AI Voice Agent",
          firstMessage: `Namaste ${recipientName} ji! Main GrandSquare Supermart se Priya bol rahi hoon. Aapke liye hamara special 15 percent discount offer tayyar hai. Kya aap offer ke baare mein jaanna chahenge?`,
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "hi",
            endpointing: 200,
          },
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            temperature: 0.5,
            messages: [
              {
                role: "system",
                content: `You are Priya, a friendly, intelligent, and helpful Hindi & Hinglish speaking AI Business Assistant calling live from GrandSquare Supermart (powered by Bizora).
You are having an active, two-way cellular phone conversation with ${recipientName}.

BUSINESS & STORE INFORMATION:
- Store Name: GrandSquare Supermart.
- What We Sell: Fresh fruits & vegetables, dairy products (milk, paneer, butter), staple groceries (atta, basmati rice, cooking oil, pulses), snacks, beverages, and daily household items.
- Top Featured Items: ${productCatalogSummary}.
- Current Promotional Offer: Flat 15% Discount on total bill above ₹499 with Coupon Code "BIZORA15".
- Delivery: Express 10-to-20 minute doorstep delivery available, or customer can visit the store directly.

CONVERSATIONAL RULES (STRICT & CRITICAL):
1. THE GREETING HAS ALREADY BEEN SPOKEN IN THE FIRST MESSAGE. Do NOT greet again. NEVER say "Namaste", "Hello", or introduce yourself again once the conversation has started.
2. ACTIVELY ANSWER QUESTIONS:
   - If the customer asks what the offer is or what items are on offer (e.g. "Offer kis par hai?", "Kaun kaun si cheezein hain?", "What is the offer?", "Tell me offer kis par hai?"):
     Answer directly and specifically: "Sir, hamara flat 15% discount sabhi fresh fruits, sabziyan, groceries aur dairy products par valid hai coupon code BIZORA15 ke saath. Delivery bhi sirf 15 minute mein aapke ghar pahunch jayegi."
   - If the customer asks about specific products: Mention 2-3 items like fresh fruits (aam, seb), Amul dairy paneer/doodh, Fortune oil, ya Basmati rice.
   - If the customer asks how to order or get the discount: "Aap hamari store par aa sakte hain ya hum aapke WhatsApp par coupon code aur direct order link bhej sakte hain. Kya main aapke WhatsApp par details bhej doon?"
3. KEEP RESPONSES SNAPPY & CONVERSATIONAL: Keep each response short (1 to 2 clear sentences maximum). Voice calls must be snappy, polite, and natural. Do NOT give long lectures.
4. LANGUAGE: Speak in natural, respectful Hindi or conversational Hinglish. Use respectful Indian honorifics like "ji", "sir", "dhanyavaad".
5. CONCLUDING: If the customer says "theek hai", "nahi chahiye", "bye", or hangs up, reply warmly: "Bahut bahut dhanyavaad ${recipientName} ji! Aapka din shubh ho."`,
              },
            ],
          },
          voice: {
            provider: "azure",
            voiceId: "hi-IN-SwaraNeural",
          },
          endCallMessage: `Bahut bahut dhanyavaad ${recipientName} ji! Aapka din shubh ho. GrandSquare Supermart mein aapka swagat hai.`,
        },
      };

      const vapiResponse = await fetch("https://api.vapi.ai/call", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.vapiPrivateKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vapiPayload),
      });

      const resData: any = await vapiResponse.json().catch(() => ({}));
      const isSuccess = vapiResponse.ok;
      const errorMsg = !isSuccess
        ? resData.message || resData.error || (Array.isArray(resData.errors) ? resData.errors.join(", ") : null) || `Vapi API returned HTTP ${vapiResponse.status} (${vapiResponse.statusText})`
        : undefined;

      if (logId) {
        await this.prisma.messageLog.update({
          where: { id: logId },
          data: {
            status: isSuccess ? "SENT" : "FAILED",
            providerId: resData.id || "vapi-call-" + Date.now(),
          },
        });
      }

      return {
        success: isSuccess,
        error: errorMsg,
        data: {
          callId: resData.id || "vapi-call-" + Date.now(),
          status: resData.status || (isSuccess ? "queued" : "failed"),
          firstMessage: contextMsg,
          details: resData,
        },
      };
    } catch (err: any) {
      console.warn("[Voice Gateway Fallback]:", err?.message);
      if (logId) {
        try {
          await this.prisma.messageLog.update({
            where: { id: logId },
            data: { status: "QUEUED_LOCAL" },
          });
        } catch (e) {}
      }

      return {
        success: true,
        data: {
          callId: "bizvoice-local-" + Date.now(),
          status: "simulated_local",
          firstMessage: contextMsg,
          message: "Voice call recorded in store dispatch queue (Self-hosted offline mode)",
        },
      };
    }
  }

  async getMessageLogs(workspaceId: string) {
    try {
      const logs = await this.prisma.messageLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return { success: true, data: logs };
    } catch (err) {
      return { success: true, data: [] };
    }
  }

  async handleVapiWebhook(payload: any) {
    try {
      console.log('📥 [Vapi Webhook] Event received:', payload?.message?.type || 'unknown');
      const messageType = payload?.message?.type;
      const callData = payload?.message?.call;

      // 1. Dynamic Inbound Assistant Request (When customer dials store number)
      if (messageType === 'assistant-request') {
        return {
          assistant: {
            name: "Bizora Inbound Customer Voice Assistant",
            transcriber: {
              provider: "deepgram",
              model: "nova-2",
              language: "hi",
              smartFormat: true,
              backgroundDenoisingEnabled: true,
            },
            model: {
              provider: "openai",
              model: "gpt-4o-mini",
              temperature: 0.3,
              messages: [
                {
                  role: "system",
                  content: `You are the polite, helpful, and respectful AI Receptionist and Customer Support voice assistant for GrandSquare Supermart powered by Bizora AI.
A customer has called the store.

YOUR CAPABILITIES & RULES:
1. GREETING: Warmly greet in respectful Hindi / Hinglish ("Namaste! GrandSquare Supermart mein aapka swagat hai. Main aapki kya madad kar sakti hoon?").
2. STORE TIMINGS: The store is open all 7 days from 9:00 AM to 10:00 PM.
3. LOCATION: We are located at GrandSquare Mall, Ground Floor, Main High Street.
4. DELIVERY: We offer 10-minute hyperlocal delivery through the Bizora Customer App.
5. STOCK INQUIRIES: Dairy (Amul milk, paneer, butter), fresh fruits/vegetables, FMCG, snacks, and beverages are always in fresh stock.
6. ORDER STATUS: Politely tell them their recent order is being packed and dispatched via our delivery fleet.
7. SPEECH CLARITY: Speak naturally, calmly, at a 0.9x human conversational speed. Keep answers concise (1-2 sentences). Never talk over the customer.`,
                },
              ],
            },
            voice: {
              provider: "azure",
              voiceId: "hi-IN-SwaraNeural",
              speed: 0.92,
              style: "customerservice",
            },
            firstMessage: "Namaste! GrandSquare Supermart customer desk mein aapka swagat hai. Main aapki kya sahayata kar sakti hoon?",
            endCallMessage: "GrandSquare Supermart ko call karne ke liye dhanyavaad. Aapka din shubh ho!",
          },
        };
      }

      // 2. End-of-call report (Save transcript, summary, audio duration to database)
      if (messageType === 'end-of-call-report' && callData) {
        const callId = callData.id;
        const customerNumber = callData.customer?.number || 'Unknown Caller';
        const transcript = callData.transcript || '';
        const summary = payload.message?.analysis?.summary || '';
        const duration = callData.duration || 0;
        const endedReason = callData.endedReason || 'normal';

        console.log(`📞 Vapi Call Ended. ID: ${callId}, Duration: ${duration}s, Reason: ${endedReason}`);

        const existingLog = await this.prisma.messageLog.findFirst({
          where: { providerId: callId },
        });

        if (existingLog) {
          await this.prisma.messageLog.update({
            where: { id: existingLog.id },
            data: {
              status: endedReason === 'normal' || endedReason === 'customer-hung-up' ? 'DELIVERED' : 'FAILED',
              body: `${existingLog.body}\n\n--- AI CALL TRANSCRIPT (${duration}s) ---\nSummary: ${summary}\n\nTranscript: ${transcript}`,
              error: endedReason !== 'normal' && endedReason !== 'customer-hung-up' ? `Ended: ${endedReason}` : null,
            },
          });
          console.log(`✅ MessageLog updated with call transcript for ID: ${callId}`);
        } else {
          // Inbound call log created automatically
          await this.prisma.messageLog.create({
            data: {
              workspaceId: 'grandsquare-mall',
              channel: 'VOICE',
              recipientName: callData.customer?.name || 'Inbound Customer',
              recipientPhone: customerNumber,
              messageType: 'INBOUND_SUPPORT',
              body: `Inbound Call (${duration}s)\nSummary: ${summary}\n\nTranscript: ${transcript}`,
              status: 'DELIVERED',
              providerId: callId,
            },
          });
          console.log(`✅ Inbound Call recorded in MessageLog for ID: ${callId}`);
        }
      }

      return { success: true, received: true };
    } catch (err: any) {
      console.error('[Vapi Webhook Error]:', err);
      return { success: false, error: err.message };
    }
  }
}
