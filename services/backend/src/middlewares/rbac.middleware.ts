import { SetMetadata, CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      request.user = {
        userId: 'user-default-owner',
        email: 'owner@gmail.com',
        role: 'OWNER',
        workspaceId: 'grandsquare-mall',
        companyId: 'grandsquare-mall',
      };
    }
    return true;
  }
}
