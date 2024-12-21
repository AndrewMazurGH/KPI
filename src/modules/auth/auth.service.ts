import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload, LoginResponse } from '../../shared/utils/auth.types';
import { UserResponse } from '../users/users.response';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(email: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (!user) return null;

        return user;
    }

    async login(user: UserResponse): Promise<LoginResponse> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
            refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' })
        };
    }

    async refreshToken(refresh_token: string): Promise<LoginResponse> {
        try {
            // Verify the refresh token
            const payload = await this.jwtService.verifyAsync(refresh_token);

            // Find user
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            // Generate new tokens
            const newPayload: JwtPayload = {
                sub: user.id,
                email: user.email,
                role: user.role,
            };

            return {
                access_token: this.jwtService.sign(newPayload, { expiresIn: '1h' }),
                refresh_token: this.jwtService.sign(newPayload, { expiresIn: '7d' })
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}