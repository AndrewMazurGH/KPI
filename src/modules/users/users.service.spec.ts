import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { UsersService } from './users.service';
import { User, UserDocument } from '../../shared/schemas/user.schema';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<UserDocument>;

  const mockUser = {
    _id: '1',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    createdAt: new Date(),
  };

  // Create properly typed mock functions
  const mockFindOne = jest.fn();
  const mockFindById = jest.fn();
  const mockCreate = jest.fn();
  const mockExec = jest.fn();

  const mockUserModel = {
    findOne: mockFindOne.mockReturnValue({ exec: mockExec }),
    findById: mockFindById.mockReturnValue({ exec: mockExec }),
    create: mockCreate,
  } as unknown as Model<UserDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      // Setup mocks
      mockExec.mockResolvedValueOnce(null); // for findOne
      mockCreate.mockResolvedValueOnce({
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.createUser(
        createUserDto.email,
        createUserDto.password,
      );

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockFindOne).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(mockCreate).toHaveBeenCalledWith({
        email: createUserDto.email,
        passwordHash: 'hashedPassword',
      });
    });

    it('should throw BadRequestException for invalid email', async () => {
      await expect(
        service.createUser('invalid-email', 'password123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short password', async () => {
      await expect(
        service.createUser('test@example.com', '123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockExec.mockResolvedValueOnce(mockUser);

      await expect(
        service.createUser(createUserDto.email, createUserDto.password),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return a user by ID successfully', async () => {
      mockExec.mockResolvedValueOnce(mockUser);

      const result = await service.findById('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.email).toBe(mockUser.email);
      expect(mockFindById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockExec.mockResolvedValueOnce(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email successfully', async () => {
      mockExec.mockResolvedValueOnce(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUser.email);
      expect(mockFindOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return null when user is not found', async () => {
      mockExec.mockResolvedValueOnce(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });
});