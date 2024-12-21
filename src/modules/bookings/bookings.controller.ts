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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from '../../shared/dto/create-booking.dto';
import { UpdateBookingDto } from '../../shared/dto/update-booking.dto';
import { BookingQueryDto } from '../../shared/dto/booking-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@ApiTags('Bookings Controller') // Swagger-тег "bookings"
@ApiBearerAuth() // Вказати, що всі методи цього контролера потребують токена
@Controller('bookings')
@UseGuards(JwtAuthGuard) // Захист всього контролера через JwtAuthGuard
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post()
  @ApiOperation({ summary: 'Створити бронювання' })
  async create(
    @User('id') userId: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(userId, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Отримати список бронювань' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Фільтр за статусом бронювання',
  })
  async findAll(@Query() query: BookingQueryDto) {
    return this.bookingsService.findAll(query);
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Отримати список власних бронювань' })
  async findMyBookings(@User('id') userId: string) {
    return this.bookingsService.findByUser(userId);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Ідентифікатор бронювання',
    example: '63f5214c7c204cf2bccd5abc'
  })
  @ApiOperation({ summary: 'Отримати конкретне бронювання за його ID' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити бронювання' })
  @ApiParam({
    name: 'id',
    description: 'ID бронювання',
  })
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Скасувати бронювання' })
  @ApiParam({
    name: 'id',
    description: 'ID бронювання',
  })
  async cancel(@Param('id') id: string, @User('id') userId: string) {
    return this.bookingsService.cancel(id, userId);
  }
}
