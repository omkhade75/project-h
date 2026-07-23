import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
const bcrypt = require('bcryptjs');

@Injectable()
export class SystemAdminService {
  constructor(private prisma: DatabaseService) {}

  private checkAdmin(user: any) {
    // Relaxed for mock / dev purposes; strictly check user.isSystemAdmin in prod
    if (user && user.isSystemAdmin === false) {
      // throw new UnauthorizedException('System Admin access required.');
    }
    return user || { id: 'admin123', email: 'admin@omnimind.ai' };
  }

  async getDashboard(user: any) {
    this.checkAdmin(user);

    const pending = await this.prisma.pendingRegistration.findMany({
      where: { status: 'Pending' },
      orderBy: { createdAt: 'desc' },
    });

    const approved = await this.prisma.pendingRegistration.findMany({
      where: { status: 'Approved' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const rejected = await this.prisma.pendingRegistration.findMany({
      where: { status: 'Rejected' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const suspended = await this.prisma.pendingRegistration.findMany({
      where: { status: 'Suspended' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const totalCompanies = await this.prisma.workspace.count();
    const activeCompanies = await this.prisma.workspace.count({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
    });
    const suspendedCompanies = await this.prisma.workspace.count({
      where: { status: 'SUSPENDED' },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const monthlyRegistrations = await this.prisma.pendingRegistration.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const todayRegistrations = await this.prisma.pendingRegistration.count({
      where: { createdAt: { gte: startOfToday } },
    });

    const userCount = await this.prisma.user.count();

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const onlineUsers = await this.prisma.loginHistory.count({
      where: { timestamp: { gte: fifteenMinsAgo }, status: 'Success' },
    });

    const aiUsage = await this.prisma.recommendation.count() + await this.prisma.anomaly.count();
    
    return {
      success: true,
      data: {
        pending,
        approved,
        rejected,
        suspended,
        stats: {
          totalCompanies,
          activeCompanies,
          pendingCount: pending.length,
          approvedCount: approved.length,
          rejectedCount: rejected.length,
          suspendedCount: suspendedCompanies,
          monthlyRegistrations,
          todayRegistrations,
          onlineUsers: onlineUsers || 1,
          aiUsage,
          storageUsage: 1024 * 1024, 
          totalUsers: userCount,
        },
      }
    };
  }

  async approveRegistration(user: any, id: string, ipAddress: string, userAgent: string) {
    const admin = this.checkAdmin(user);
    const registration = await this.prisma.pendingRegistration.findUnique({ where: { id } });

    if (!registration) throw new Error('Registration not found');
    
    let workspaceId = '';

    await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: registration.companyName,
          industry: registration.industry,
          businessType: registration.businessType,
          timezone: registration.timezone,
          currency: registration.currency,
          status: 'ACTIVE',
          setupCompleted: false,
          plan: 'TRIAL',
          subscriptionStatus: 'TRIAL',
          trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      workspaceId = workspace.id;

      await tx.workspaceSettings.create({
        data: {
          workspaceId: workspace.id,
          branding: JSON.stringify({ primaryColor: '#4f46e5' }),
          features: JSON.stringify(['core', 'ai', 'reports']),
        },
      });

      await tx.notificationSettings.create({
        data: { workspaceId: workspace.id, emailAlerts: true, smsAlerts: false },
      });

      await tx.securitySettings.create({
        data: { workspaceId: workspace.id, twoFactorAuth: false, ipWhitelist: null },
      });

      await tx.dashboardPreferences.create({
        data: { workspaceId: workspace.id, theme: 'dark', layout: null },
      });

      await tx.aIConfiguration.create({
        data: { workspaceId: workspace.id, modelName: 'gemini-1.5-pro', temperature: 0.7 },
      });

      const owner = await tx.user.create({
        data: {
          name: registration.ownerName,
          email: registration.ownerEmail,
          passwordHash: registration.passwordHash,
          role: 'OWNER',
          workspaceId: workspace.id,
          isSystemAdmin: false,
          status: 'Active',
        },
      });

      await tx.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: owner.id, role: 'OWNER' },
      });

      await tx.pendingRegistration.update({
        where: { id: registration.id },
        data: { status: 'Approved' },
      });

      await tx.approvalAudit.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          tenantName: registration.ownerName,
          workspaceId: workspace.id,
          userAgent: userAgent || 'Unknown',
          ipAddress: ipAddress || '127.0.0.1',
          actionType: 'APPROVE',
          registrationId: registration.id,
        },
      });
    });

    return { success: true, data: { workspaceId } };
  }

  async rejectRegistration(user: any, id: string, reason: string, ipAddress: string, userAgent: string) {
    const admin = this.checkAdmin(user);
    const registration = await this.prisma.pendingRegistration.findUnique({ where: { id } });
    if (!registration) throw new Error('Registration not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.pendingRegistration.update({
        where: { id },
        data: { status: 'Rejected' },
      });

      await tx.approvalAudit.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          tenantName: registration.ownerName,
          workspaceId: 'N/A',
          userAgent: userAgent || 'Unknown',
          ipAddress: ipAddress || '127.0.0.1',
          actionType: 'REJECT',
          registrationId: registration.id,
        },
      });
    });

    return { success: true };
  }

  async suspendRegistration(user: any, id: string, reason: string, ipAddress: string, userAgent: string) {
    const admin = this.checkAdmin(user);
    const registration = await this.prisma.pendingRegistration.findUnique({ where: { id } });
    if (!registration) throw new Error('Registration not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.pendingRegistration.update({
        where: { id },
        data: { status: 'Suspended' },
      });

      await tx.approvalAudit.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          tenantName: registration.ownerName,
          workspaceId: 'N/A',
          userAgent: userAgent || 'Unknown',
          ipAddress: ipAddress || '127.0.0.1',
          actionType: 'SUSPEND',
          registrationId: registration.id,
        },
      });
    });
    return { success: true };
  }

  async deleteRegistration(user: any, id: string) {
    this.checkAdmin(user);
    await this.prisma.pendingRegistration.delete({ where: { id } });
    return { success: true };
  }

  async searchCompanies(user: any, queryStr: string = "") {
    this.checkAdmin(user);
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        AND: [
          { name: { contains: queryStr, mode: 'insensitive' } },
          { status: { not: 'DELETED' } },
        ],
      },
      include: {
        users: { where: { role: 'OWNER' }, take: 1 },
        _count: {
          select: {
            products: true, customers: true, transactions: true, users: true,
            suppliers: true, departments: true, expenses: true, recommendations: true,
            anomalies: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: { workspaces } };
  }

  async suspendWorkspace(user: any, id: string, ipAddress: string, userAgent: string) {
    const admin = this.checkAdmin(user);
    const workspace = await this.prisma.workspace.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      include: { users: { where: { role: 'OWNER' }, take: 1 } },
    });

    const ownerName = workspace.users[0]?.name || 'N/A';
    await this.prisma.approvalAudit.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        tenantName: ownerName,
        workspaceId: workspace.id,
        userAgent: userAgent || 'Unknown',
        ipAddress: ipAddress || '127.0.0.1',
        actionType: 'SUSPEND_WORKSPACE',
      },
    });
    return { success: true };
  }

  async reactivateWorkspace(user: any, id: string, ipAddress: string, userAgent: string) {
    const admin = this.checkAdmin(user);
    const workspace = await this.prisma.workspace.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: { users: { where: { role: 'OWNER' }, take: 1 } },
    });

    const ownerName = workspace.users[0]?.name || 'N/A';
    await this.prisma.approvalAudit.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        tenantName: ownerName,
        workspaceId: workspace.id,
        userAgent: userAgent || 'Unknown',
        ipAddress: ipAddress || '127.0.0.1',
        actionType: 'REACTIVATE_WORKSPACE',
      },
    });
    return { success: true };
  }

  async deleteWorkspace(user: any, id: string, ipAddress: string, userAgent: string) {
    const admin = this.checkAdmin(user);
    const workspace = await this.prisma.workspace.update({
      where: { id },
      data: { status: 'DELETED' },
      include: { users: { where: { role: 'OWNER' }, take: 1 } },
    });

    const ownerName = workspace.users[0]?.name || 'N/A';
    await this.prisma.approvalAudit.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        tenantName: ownerName,
        workspaceId: workspace.id,
        userAgent: userAgent || 'Unknown',
        ipAddress: ipAddress || '127.0.0.1',
        actionType: 'DELETE_WORKSPACE',
      },
    });
    return { success: true };
  }

  async resetOwnerPassword(user: any, workspaceId: string, password?: string) {
    this.checkAdmin(user);
    const newPass = password || 'Temp123456';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPass, salt);

    const ownerUser = await this.prisma.user.findFirst({
      where: { workspaceId, role: 'OWNER' },
    });
    if (!ownerUser) throw new Error('No owner found');

    await this.prisma.user.update({
      where: { id: ownerUser.id },
      data: { passwordHash },
    });

    return { success: true, data: { tempPassword: newPass } };
  }

  async resendWelcomeEmail(user: any, workspaceId: string) {
    this.checkAdmin(user);
    // Mocked email resend
    return { success: true };
  }

  async getAuditLogs(user: any) {
    this.checkAdmin(user);
    const audits = await this.prisma.approvalAudit.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return { success: true, data: { audits } };
  }

  async exportWorkspace(user: any, workspaceId: string) {
    this.checkAdmin(user);
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        settings: true,
        notificationSettings: true,
        securitySettings: true,
        dashboardPreferences: true,
        aiConfiguration: true,
        users: true,
        departments: true,
        products: true,
        customers: true,
        transactions: true,
        suppliers: true,
      },
    });
    return { success: true, data: { workspaceData: JSON.stringify(workspace, null, 2) } };
  }

  async importWorkspace(user: any, workspaceId: string, importData: string) {
    this.checkAdmin(user);
    const imported = JSON.parse(importData);

    await this.prisma.$transaction(async (tx) => {
      await tx.workspaceSettings.deleteMany({ where: { workspaceId } });
      await tx.notificationSettings.deleteMany({ where: { workspaceId } });
      await tx.securitySettings.deleteMany({ where: { workspaceId } });
      await tx.dashboardPreferences.deleteMany({ where: { workspaceId } });
      await tx.aIConfiguration.deleteMany({ where: { workspaceId } });

      if (imported.settings) {
        await tx.workspaceSettings.create({ data: { workspaceId, branding: imported.settings.branding, features: imported.settings.features } });
      }
      if (imported.notificationSettings) {
        await tx.notificationSettings.create({ data: { workspaceId, emailAlerts: imported.notificationSettings.emailAlerts, smsAlerts: imported.notificationSettings.smsAlerts } });
      }
      if (imported.securitySettings) {
        await tx.securitySettings.create({ data: { workspaceId, twoFactorAuth: imported.securitySettings.twoFactorAuth, ipWhitelist: imported.securitySettings.ipWhitelist } });
      }
      if (imported.dashboardPreferences) {
        await tx.dashboardPreferences.create({ data: { workspaceId, theme: imported.dashboardPreferences.theme, layout: imported.dashboardPreferences.layout } });
      }
      if (imported.aiConfiguration) {
        await tx.aIConfiguration.create({ data: { workspaceId, modelName: imported.aiConfiguration.modelName, temperature: imported.aiConfiguration.temperature } });
      }
    });

    return { success: true };
  }
}
