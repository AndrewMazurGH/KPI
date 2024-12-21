import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../shared/schemas/user.schema';
import { UserResponse } from './users.response';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async createUser(email: string, password: string): Promise<UserResponse> {
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
        const user = await this.userModel.create({ email, passwordHash });

        // Transform to response object
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
