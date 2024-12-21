import { IsOptional, IsDate, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { BookingStatus } from '../interfaces/booking.interface';

export class BookingQueryDto {
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  endDate?: Date;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
