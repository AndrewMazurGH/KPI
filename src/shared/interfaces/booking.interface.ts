export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed'
  }

export interface IBooking {
  _id: string;
  userId: string;
  roomId: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
