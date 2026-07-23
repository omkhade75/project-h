import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserModel, CompanyModel } from '../models';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil } from '../utils/jwt.util';

@Injectable()
export class AuthService {
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
    const user = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await PasswordUtil.comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId?.toString(),
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
