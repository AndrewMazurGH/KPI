import { Controller, Post, UseGuards, Body, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { LoginResponse } from '../../shared/utils/auth.types';
import { ApiOperation, ApiBody } from '@nestjs/swagger';



@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'john.doe@example.com' },
                password: { type: 'string', example: 'secretPass123' },
            },
        },
    })
    @ApiOperation({ summary: 'Увійти з email і паролем' })
    async login(@Request() req): Promise<LoginResponse> {
        // LocalAuthGuard вже валідував користувача і додав його до request
        return this.authService.login(req.user);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Оновити токен доступу' })
    async refresh(@Body() body: { refresh_token: string }): Promise<LoginResponse> {
        return this.authService.refreshToken(body.refresh_token);
    }
}

function ApiTags(arg0: string): (target: typeof AuthController) => void | typeof AuthController {
    throw new Error('Function not implemented.');
}
