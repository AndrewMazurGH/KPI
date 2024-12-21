import { IsEmail, MinLength, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../utils/user-role.enum'

export class CreateUserDto {
    @IsEmail()
    email: string;

    @MinLength(8)
    password: string;

    @IsNotEmpty()
    nickname: string;

    @IsNotEmpty()
    phone: string;

    @IsNotEmpty()
    firstName: string;

    @IsNotEmpty()
    lastName: string;

    @IsOptional() // можна робити необов’язковим
    @IsEnum(UserRole)
    role?: UserRole;
}
