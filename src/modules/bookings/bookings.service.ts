import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema'

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async createBooking(userId: string, data: any) {
    const newBooking = new this.bookingModel({ userId, ...data });
    return newBooking.save();
  }

  async getBookingsByUser(userId: string) {
    return this.bookingModel.find({ userId }).exec();
  }

  // тощо...
}
