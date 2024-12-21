// common/guards/roles.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Дістаємо потрібні ролі з метаданих
        const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());

        // Якщо на методі немає `@Roles(...)`, вважаємо, що він відкритий для всіх, або повертаємо true
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Дістаємо користувача з request (його додає JWT Guard)
        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            throw new ForbiddenException('User not found in request');
        }

        // Перевіряємо, чи роль користувача входить у список дозволених
        const hasRole = requiredRoles.some((role) => user.role === role);
        if (!hasRole) {
            throw new ForbiddenException(`Requires one of roles: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}
