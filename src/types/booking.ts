export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  tourId: string;
  userId: string;
  date: string;
  participants: number;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFormData extends Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> {}

export interface BookingResponse {
  success: boolean;
  data?: Booking | Booking[];
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}
