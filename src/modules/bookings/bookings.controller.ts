import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Put, 
    Delete, 
    Query, 
    UseGuards,
    HttpStatus 
  } from '@nestjs/common';
  import { BookingsService } from './bookings.service';
  import { CreateBookingDto } from '../../shared/dto/create-booking.dto';
  import { UpdateBookingDto } from '../../shared/dto/update-booking.dto';
  import { BookingQueryDto } from '../../shared/dto/booking-query.dto';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { User } from '../../common/decorators/user.decorator';
  
  @Controller('bookings')
  @UseGuards(JwtAuthGuard)
  export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) {}
  
    @Post()
    async create(@User('id') userId: string, @Body() createBookingDto: CreateBookingDto) {
      return this.bookingsService.create(userId, createBookingDto);
    }
  
    @Get()
    async findAll(@Query() query: BookingQueryDto) {
      return this.bookingsService.findAll(query);
    }
  
    @Get('my-bookings')
    async findMyBookings(@User('id') userId: string) {
      return this.bookingsService.findByUser(userId);
    }
  
    @Get(':id')
    async findOne(@Param('id') id: string) {
      return this.bookingsService.findById(id);
    }
  
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
      return this.bookingsService.update(id, updateBookingDto);
    }
  
    @Delete(':id')
    async cancel(@Param('id') id: string, @User('id') userId: string) {
      return this.bookingsService.cancel(id, userId);
    }
  }