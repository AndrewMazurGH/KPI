import {
  IsDate,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
