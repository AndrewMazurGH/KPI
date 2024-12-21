import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus } from '../interfaces/booking.interface';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Room' })
  roomId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ 
    type: String, 
    enum: BookingStatus, 
    default: BookingStatus.PENDING 
  })
  status: BookingStatus;

  @Prop()
  notes?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Add indexes for better query performance
BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ roomId: 1, startDate: 1, endDate: 1 });