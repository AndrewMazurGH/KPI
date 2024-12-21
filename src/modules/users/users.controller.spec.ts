import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from '../../shared/dto/create-user.dto';
import { UserResponse } from './users.response';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    createUser: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUserResponse: UserResponse = {
      id: '1',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    it('should create a new user successfully', async () => {
      mockUsersService.createUser.mockResolvedValue(mockUserResponse);

      const result = await controller.register(createUserDto);

      expect(result).toEqual(mockUserResponse);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        createUserDto.email,
        createUserDto.password,
      );
    });

    it('should throw BadRequestException for invalid email', async () => {
      mockUsersService.createUser.mockRejectedValue(
        new BadRequestException('Invalid email format'),
      );

      await expect(
        controller.register({
          ...createUserDto,
          email: 'invalid-email',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short password', async () => {
      mockUsersService.createUser.mockRejectedValue(
        new BadRequestException('Password must be at least 8 characters'),
      );

      await expect(
        controller.register({
          ...createUserDto,
          password: '123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserById', () => {
    const mockUserResponse: UserResponse = {
      id: '1',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    it('should return a user by ID successfully', async () => {
      mockUsersService.findById.mockResolvedValue(mockUserResponse);

      const result = await controller.getUserById('1');

      expect(result).toEqual(mockUserResponse);
      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockUsersService.findById.mockRejectedValue(
        new NotFoundException('User #1 not found'),
      );

      await expect(controller.getUserById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});