import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async createBooking(@Body() body: any) {
    // Приклад: userId беремо з body або з token (Guard)
    return this.bookingsService.createBooking(body.userId, body);
  }

  @Get(':userId')
  async getBookings(@Param('userId') userId: string) {
    return this.bookingsService.getBookingsByUser(userId);
  }
}
