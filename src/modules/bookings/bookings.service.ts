import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../../shared/schemas/booking.schema';
import { CreateBookingDto } from '../../shared/dto/create-booking.dto';
import { UpdateBookingDto } from '../../shared/dto/update-booking.dto';
import { BookingQueryDto } from '../../shared/dto/booking-query.dto';
import { BookingStatus } from '../../shared/interfaces/booking.interface';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async create(userId: string, createBookingDto: CreateBookingDto): Promise<BookingDocument> {
    // Check for booking conflicts
    const conflictingBooking = await this.bookingModel.findOne({
      roomId: new Types.ObjectId(createBookingDto.roomId),  // Convert to ObjectId here
      status: { $ne: BookingStatus.CANCELLED },
      $or: [
        {
          startDate: { $lt: createBookingDto.endDate },
          endDate: { $gt: createBookingDto.startDate }
        }
      ]
    }).exec();  // Add .exec()
  
    if (conflictingBooking) {
      throw new BadRequestException('Room is already booked for this time period');
    }
  
    // Use create instead of new + save
    return this.bookingModel.create({
      userId: new Types.ObjectId(userId),
      roomId: new Types.ObjectId(createBookingDto.roomId),
      startDate: createBookingDto.startDate,
      endDate: createBookingDto.endDate
    });
  }

  async findAll(query: BookingQueryDto) {
    const filter: any = {};
    
    if (query.startDate) {
      filter.startDate = { $gte: query.startDate };
    }
    if (query.endDate) {
      filter.endDate = { $lte: query.endDate };
    }
    if (query.status) {
      filter.status = query.status;
    }

    return this.bookingModel
      .find(filter)
      .populate('userId', 'name email')
      .populate('roomId', 'name capacity')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUser(userId: string): Promise<BookingDocument[]> {
    return this.bookingModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('roomId', 'name capacity')
      .sort({ startDate: -1 })
      .exec();
  }

  async findById(id: string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('roomId', 'name capacity')
      .exec();

    if (!booking) {
      throw new NotFoundException(`Booking #${id} not found`);
    }

    return booking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findByIdAndUpdate(id, updateBookingDto, { new: true })
      .exec();

    if (!booking) {
      throw new NotFoundException(`Booking #${id} not found`);
    }

    return booking;
  }

  async cancel(id: string, userId: string): Promise<BookingDocument> {
    const booking = await this.bookingModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId)
    });

    if (!booking) {
      throw new NotFoundException(`Booking #${id} not found`);
    }

    booking.status = BookingStatus.CANCELLED;
    return booking.save();
  }
}