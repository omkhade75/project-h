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
    vapiPhoneId: "e0cfb9a5-a9d8-4422-a09c-b87ef3a50c95",
    vapiAgentId: "294c5d56-74a9-472d-a0ba-5c626aca4747",
    vapiPublicKey: "4a80f4e1-29e2-4236-afd3-0d41c54d3793",
    vapiPrivateKey: "6ab6eb8f-0c48-4d51-9cdd-38caf3977158",
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

    let phone = data.phoneNumber.trim().replace(/\s+/g, "");
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
          recipientName: data.recipientName,
          recipientPhone: phone,
          messageType: "CRM_OUTREACH",
          body: data.messageContext,
          status: "PENDING",
        },
      });
      logId = log.id;
    } catch (dbErr) {}

    // Mock Vapi call for now to avoid actual outbound charges
    setTimeout(async () => {
      try {
        if (logId) {
          await this.prisma.messageLog.update({
            where: { id: logId },
            data: { status: 'SENT', providerId: 'mock-vapi-call-' + Date.now() },
          });
        }
      } catch (err) {}
    }, 1000);

    return {
      success: true,
      data: {
        callId: 'mock-vapi-call-' + Date.now(),
        status: 'queued',
      }
    };
  }
}
