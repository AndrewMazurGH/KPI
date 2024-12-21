// bookings.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { BookingsService } from './bookings.service';
import { Booking, BookingDocument } from '../../shared/schemas/booking.schema';
import { CreateBookingDto } from '../../shared/dto/create-booking.dto';
import { UpdateBookingDto } from '../../shared/dto/update-booking.dto';
import { BookingQueryDto } from '../../shared/dto/booking-query.dto';
import { BookingStatus } from '../../shared/interfaces/booking.interface';

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingModel: Model<BookingDocument>;

  // --------------------------------------------------
  // Приклад ідентифікаторів
  // --------------------------------------------------
  const mockUserId = new Types.ObjectId();
  const mockRoomId = new Types.ObjectId();

  // --------------------------------------------------
  // Дати
  // --------------------------------------------------
  const baseStartDate = new Date();
  const baseEndDate = new Date(baseStartDate.getTime() + 24 * 60 * 60 * 1000);

  // --------------------------------------------------
  // "Мок" бронювання (можна залишити як any або Partial<BookingDocument>)
  // --------------------------------------------------
  const mockBooking: any = {
    _id: new Types.ObjectId(),
    userId: mockUserId,
    roomId: mockRoomId,
    startDate: baseStartDate,
    endDate: baseEndDate,
    status: BookingStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // --------------------------------------------------
  // Мок-імплементація exec() і ланцюжка mongoose
  // --------------------------------------------------
  const mockExec = jest.fn();
  const mockQuery: any = {
    exec: mockExec,
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  };

  // --------------------------------------------------
  // Мок-імплементація самої моделі
  // --------------------------------------------------
  const mockBookingModel = {
    // Для створення документа
    create: jest.fn(),

    // Для пошуку/оновлення
    find: jest.fn(() => mockQuery),
    findOne: jest.fn(() => mockQuery),
    findById: jest.fn(() => mockQuery),
    findByIdAndUpdate: jest.fn(() => mockQuery),
  };

  beforeEach(async () => {
    // Щоб у кожному тесті починати з "чистих" викликів:
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getModelToken(Booking.name),
          useValue: mockBookingModel,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingModel = module.get<Model<BookingDocument>>(getModelToken(Booking.name));
  });

  describe('create', () => {
    const createDto: CreateBookingDto = {
      roomId: mockRoomId.toString(),
      startDate: baseStartDate,
      endDate: baseEndDate,
    };

    it('should create a booking successfully', async () => {
      // Fix: Make sure to reset ALL mocks and set up proper chain
      mockExec.mockReset();
      mockQuery.populate.mockReturnThis();
      mockQuery.sort.mockReturnThis();
      mockExec.mockResolvedValueOnce(null); // For conflict check
      (bookingModel.create as jest.Mock).mockResolvedValueOnce(mockBooking);
    
      const result = await service.create(mockUserId.toString(), createDto);
    
      expect(result).toEqual(mockBooking);
      expect(bookingModel.findOne).toHaveBeenCalledWith({
        roomId: mockRoomId,
        status: { $ne: BookingStatus.CANCELLED },
        $or: [
          {
            startDate: { $lt: baseEndDate },
            endDate: { $gt: baseStartDate },
          },
        ],
      });
      expect(bookingModel.create).toHaveBeenCalledWith({
        userId: mockUserId,
        roomId: mockRoomId,
        startDate: baseStartDate,
        endDate: baseEndDate,
      });
      // І що create викликали із очікуваним payload
      expect(bookingModel.create).toHaveBeenCalledWith({
        userId: mockUserId,
        roomId: mockRoomId,
        startDate: baseStartDate,
        endDate: baseEndDate,
      });
    });

    it('should throw BadRequestException if there is a conflict', async () => {
      // Якщо знайдено конфліктне бронювання, findOne(...).exec() повертає об'єкт
      mockExec.mockResolvedValueOnce(mockBooking);

      await expect(
        service.create(mockUserId.toString(), createDto),
      ).rejects.toThrowError(BadRequestException);

      // Перевіримо, що create не викликали (бо впали на конфлікті)
      expect(bookingModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all bookings without filters', async () => {
      const mockBookings = [mockBooking];
      // Fix: Reset mock and ensure it returns the array
      mockExec.mockReset();
      mockQuery.populate.mockReturnThis();
      mockQuery.sort.mockReturnThis();
      mockExec.mockResolvedValueOnce(mockBookings);
    
      const query: BookingQueryDto = {};
      const result = await service.findAll(query);
    
      expect(result).toEqual(mockBookings);
      expect(bookingModel.find).toHaveBeenCalledWith({});
    });

    it('should filter by startDate and endDate', async () => {
      const mockBookings = [mockBooking];
      // Fix: Reset mock and ensure it returns an array
      mockExec.mockReset();
      mockQuery.populate.mockReturnThis();
      mockQuery.sort.mockReturnThis();
      mockExec.mockResolvedValueOnce(mockBookings);
    
      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const endDate = new Date('2024-01-05T00:00:00.000Z');
      const query: BookingQueryDto = { startDate, endDate };
    
      const result = await service.findAll(query);
    
      expect(result).toEqual(mockBookings);
      expect(bookingModel.find).toHaveBeenCalledWith({
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateBookingDto = {
      status: BookingStatus.CONFIRMED,
    };

    it('should update booking successfully', async () => {
      // Сервіс очікує 1 об'єкт від findByIdAndUpdate(...).exec()
      const updatedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED };
      // Reset mock and return single object, not array
      mockExec.mockReset();
      mockExec.mockResolvedValueOnce(updatedBooking);

      const result = await service.update(mockBooking._id.toString(), updateDto);

      // Перевіряємо результат
      expect(result).toEqual(updatedBooking);
      // Перевіряємо, що findByIdAndUpdate викликали з правильними параметрами
      expect(bookingModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBooking._id.toString(),
        updateDto,
        { new: true },
      );
    });

    it('should throw NotFoundException if booking not found', async () => {
      // Reset mock and return null
      mockExec.mockReset();
      mockExec.mockResolvedValueOnce(null);

      await expect(
        service.update(mockBooking._id.toString(), updateDto),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  // Ви можете додати тести для findById, cancel, тощо за аналогією.
});
