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
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioWhatsAppSender: "whatsapp:+14155238886",
    ownerWhatsAppNumber: "+919876543210",
    managerWhatsAppNumber: "+919876543211",
  };

  private memoryVapiConfigCache: VapiConfig = {
    vapiPhoneId: "027dfd39-b626-43cf-859f-6583a33f580b",
    vapiAgentId: "88b76de6-b66b-46f0-a536-8182804fab8a",
    vapiPublicKey: "e3322c27-c9ac-45cb-9c58-e49c8f423a1f",
    vapiPrivateKey: "581c84cb-6185-4714-98d1-bdd823189ea0",
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
    return { success: true };
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

    let logId = "";
    try {
      const log = await this.prisma.messageLog.create({
        data: {
          workspaceId,
          channel: "VOICE",
          recipientName: data.recipientName || "Voice Recipient",
          recipientPhone: phone,
          messageType: "CRM_OUTREACH",
          body: data.messageContext || data.script || "Bizora AI Calling Agent Outreach",
          status: "PENDING",
        },
      });
      logId = log.id;
    } catch (dbErr) {}

    // Dispatch real outbound phone call via Vapi REST API
    try {
      const vapiResponse = await fetch("https://api.vapi.ai/call/phone", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.vapiPrivateKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumberId: config.vapiPhoneId,
          assistantId: config.vapiAgentId,
          customer: {
            number: phone,
            name: data.recipientName || "Valued Business Partner",
          },
          assistantOverrides: {
            variableValues: {
              messageContext: data.messageContext || data.script || "Urgent operational update regarding your business account.",
              recipientName: data.recipientName || "Partner",
            },
          },
        }),
      });

      const resData: any = await vapiResponse.json();

      if (logId) {
        await this.prisma.messageLog.update({
          where: { id: logId },
          data: {
            status: vapiResponse.ok ? "SENT" : "FAILED",
            providerId: resData.id || "vapi-call-" + Date.now(),
          },
        });
      }

      return {
        success: vapiResponse.ok,
        data: {
          callId: resData.id || "vapi-call-" + Date.now(),
          status: resData.status || (vapiResponse.ok ? "queued" : "failed"),
          details: resData,
        },
      };
    } catch (err: any) {
      console.error("[Vapi API Call Error]:", err);
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
        error: err?.message || "Failed to dispatch Vapi AI voice call",
      };
    }
  }
}
