import { Controller, Post, Body, Get, Param, UseGuards, Patch } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserResponse } from './users.response';
import { CreateUserDto } from '../../shared/dto/create-user.dto';
import { UserRole } from 'src/shared/utils/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users Controller') // Додає тег "users" для всіх методів контролера в Swagger
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('register')
    @ApiOperation({ summary: 'Зареєструвати нового користувача' })
    @ApiBody({
        description: 'Дані для створення користувача',
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'john.doe@example.com' },
                password: { type: 'string', example: 'securePassword123' },
            },
        },
    })
    async register(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
        return this.usersService.createUser(
            createUserDto.email,
            createUserDto.password
        );
    }

    @Get('email/:email')
    @ApiOperation({ summary: 'Get user information by email' })
    @ApiParam({
        name: 'email',
        description: 'User email address',
        example: 'john.doe@example.com',
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async getUserByEmail(@Param('email') email: string): Promise<UserResponse> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }
        return user;
    }
    @Get(':id')
    @ApiOperation({ summary: 'Отримати інформацію про користувача за його ID' })
    @ApiParam({
        name: 'id',
        description: 'Унікальний ідентифікатор користувача',
        example: '64a9bc7c1234abcd5678ef90',
    })
    async getUserById(@Param('id') id: string): Promise<UserResponse> {
        return this.usersService.findById(id);
    }

    @Patch(':id/role')
    @ApiOperation({ summary: 'Оновити роль користувача' })
    @ApiParam({
        name: 'id',
        description: 'Унікальний ідентифікатор користувача',
        example: '64a9bc7c1234abcd5678ef90',
    })
    @ApiBody({
        description: 'Нова роль для користувача',
        schema: {
            type: 'object',
            properties: {
                role: {
                    type: 'string',
                    enum: Object.values(UserRole),
                    example: 'admin',
                },
            },
        },
    })
    @ApiBearerAuth() // Вказує, що метод потребує JWT токен
    @UseGuards(JwtAuthGuard, RolesGuard) // Guard для перевірки токена та ролі
    @Roles('admin') // Доступ мають лише користувачі з роллю "admin"
    async updateUserRole(@Param('id') userId: string, @Body('role') newRole: UserRole) {
        return this.usersService.updateRole(userId, newRole);
    }
}
