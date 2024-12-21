import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // якщо використовуєте MongoDB
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking, BookingSchema } from './schemas/booking.schema'
@Module({
  imports: [
    // якщо використовуємо Mongoose + MongoDB
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
