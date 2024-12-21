import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../shared/schemas/user.schema';
import { UserResponse } from './users.response';
import { UserRole } from 'src/shared/utils/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    async updateRole(userId: string, newRole: UserRole): Promise<UserResponse> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.role = newRole;
        await user.save();
        return UserResponse.fromDocument(user);
    }
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async createUser(email: string, password: string, role?: UserRole): Promise<UserResponse> {
        // Password validation
        if (password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        // Email validation
        if (!email || !email.includes('@')) {
            throw new BadRequestException('Invalid email format');
        }

        // Check for existing user
        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        // Hash password and create user
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await this.userModel.create({
            email,
            passwordHash,
            role // якщо role не передано, візьметься default = 'user'
        });
        return UserResponse.fromDocument(user);
    }

    async findById(id: string): Promise<UserResponse> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException(`User #${id} not found`);
        }
        return UserResponse.fromDocument(user);
    }

    async findByEmail(email: string): Promise<UserResponse | null> {
        const user = await this.userModel.findOne({ email }).exec();
        return user ? UserResponse.fromDocument(user) : null;
    }
}
