import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
const jwt = require('jsonwebtoken');

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const secret = process.env.JWT_SECRET || 'bizora_enterprise_super_secret_jwt_key_2026';
      const decoded = jwt.verify(token, secret);
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
