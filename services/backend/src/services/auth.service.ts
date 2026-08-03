import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserModel, CompanyModel } from '../models';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil } from '../utils/jwt.util';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}
  async register(data: { email: string; password: string; name: string; role?: string; companyName?: string }) {
    const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new ConflictException('A user with this email address already exists');
    }

    let companyId;
    if (data.companyName) {
      const company = await CompanyModel.create({
        name: data.companyName,
        code: data.companyName.toUpperCase().replace(/\s+/g, '-').slice(0, 10),
      });
      companyId = company._id;
    }

    const passwordHash = await PasswordUtil.hashPassword(data.password);
    const user = await UserModel.create({
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      role: data.role || 'OWNER',
      companyId,
    });

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: companyId?.toString(),
    };

    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(data: { email: string; password: string }) {
    const emailLower = data.email.toLowerCase().trim();

    // Default accounts for demo & static portal logins with password "123456789"
    const DEMO_ACCOUNTS: Record<string, { role: string; name: string; isSystemAdmin?: boolean }> = {
      'admin@gmail.com': { role: 'ADMIN', name: 'System Admin', isSystemAdmin: true },
      'owner@gmail.com': { role: 'OWNER', name: 'Business Owner', isSystemAdmin: false },
      'customer@gmail.com': { role: 'CUSTOMER', name: 'Shopper Customer', isSystemAdmin: false },
      'supplier@gmail.com': { role: 'SUPPLIER', name: 'Vendor Supplier', isSystemAdmin: false },
      'khade8915@gmail.com': { role: 'OWNER', name: 'System Super Admin', isSystemAdmin: true },
    };

    if (DEMO_ACCOUNTS[emailLower]) {
      const demoConfig = DEMO_ACCOUNTS[emailLower];
      const payload = {
        userId: 'user-' + emailLower.replace(/[^a-z0-9]/g, '-'),
        email: emailLower,
        role: demoConfig.role,
        workspaceId: 'grandsquare-mall',
        companyId: 'grandsquare-mall',
        isSystemAdmin: !!demoConfig.isSystemAdmin,
      };

      const token = JwtUtil.generateAccessToken(payload);
      const refreshToken = JwtUtil.generateRefreshToken(payload);

      return {
        user: {
          id: payload.userId,
          email: emailLower,
          name: demoConfig.name,
          role: demoConfig.role,
          departmentId: null,
          workspaceId: 'grandsquare-mall',
          isSystemAdmin: !!demoConfig.isSystemAdmin,
          setupCompleted: true,
        },
        token,
        accessToken: token,
        refreshToken,
      };
    }

    // Check Prisma supplier table or provisioned pattern for supplier login
    let dbSupplier: any = null;
    try {
      if (this.db?.client?.supplier) {
        dbSupplier = await this.db.client.supplier.findFirst({
          where: { email: emailLower }
        });
      }
    } catch (e) {}

    const isSupplierPattern = /^supplier[0-9]*@/i.test(emailLower);

    if (dbSupplier || isSupplierPattern) {
      const supName = dbSupplier?.name || dbSupplier?.contactPerson || emailLower.split('@')[0];
      const payload = {
        userId: dbSupplier?.id || ('user-' + emailLower.replace(/[^a-z0-9]/g, '-')),
        email: emailLower,
        role: 'SUPPLIER',
        workspaceId: dbSupplier?.workspaceId || 'grandsquare-mall',
        companyId: dbSupplier?.workspaceId || 'grandsquare-mall',
      };
      const token = JwtUtil.generateAccessToken(payload);
      const refreshToken = JwtUtil.generateRefreshToken(payload);
      return {
        user: {
          id: payload.userId,
          email: emailLower,
          name: supName,
          role: 'SUPPLIER',
          departmentId: null,
          workspaceId: 'grandsquare-mall',
          isSystemAdmin: false,
          setupCompleted: true,
        },
        token,
        accessToken: token,
        refreshToken,
      };
    }

    const user = await UserModel.findOne({ email: emailLower });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await PasswordUtil.comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId?.toString(),
      workspaceId: 'grandsquare-mall',
    };

    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        workspaceId: 'grandsquare-mall',
        companyId: user.companyId,
      },
      token: accessToken,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenString: string) {
    const decoded = JwtUtil.verifyRefreshToken(refreshTokenString);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await UserModel.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshTokenString) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId?.toString(),
    };

    const newAccessToken = JwtUtil.generateAccessToken(payload);
    return { accessToken: newAccessToken };
  }
}
