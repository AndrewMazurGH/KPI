import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from '../../shared/dto/create-booking.dto';
import { Types } from 'mongoose';
import { BookingStatus } from '../../shared/interfaces/booking.interface';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBooking = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    roomId: new Types.ObjectId(),
    startDate: new Date(),
    endDate: new Date(),
    status: BookingStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBookingsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const createBookingDto: CreateBookingDto = {
        roomId: mockBooking.roomId.toString(),
        startDate: mockBooking.startDate,
        endDate: mockBooking.endDate,
      };

      mockBookingsService.create.mockResolvedValue(mockBooking);

      const result = await controller.create(
        mockBooking.userId.toString(),
        createBookingDto,
      );

      expect(result).toEqual(mockBooking);
      expect(service.create).toHaveBeenCalledWith(
        mockBooking.userId.toString(),
        createBookingDto,
      );
    });
  });

  describe('findMyBookings', () => {
    it('should return user bookings', async () => {
      const mockBookings = [mockBooking];
      mockBookingsService.findByUser.mockResolvedValue(mockBookings);

      const result = await controller.findMyBookings(
        mockBooking.userId.toString(),
      );

      expect(result).toEqual(mockBookings);
      expect(service.findByUser).toHaveBeenCalledWith(
        mockBooking.userId.toString(),
      );
    });
  });
});
