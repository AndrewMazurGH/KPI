import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserResponse } from './users.response';
import { CreateUserDto } from '../../shared/dto/create-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
        return this.usersService.createUser(
            createUserDto.email,
            createUserDto.password
        );
    }

    @Get(':id')
    async getUserById(@Param('id') id: string): Promise<UserResponse> {
        return this.usersService.findById(id);
    }
}