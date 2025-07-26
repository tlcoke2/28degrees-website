export type EventType = 'concert' | 'festival' | 'exhibition' | 'workshop' | 'other';

export interface Event {
  id?: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  imageUrl: string;
  type: EventType;
  featured: boolean;
  capacity: number;
  includesAccommodation?: boolean;
  includesTransport?: boolean;
  includesMeals?: boolean;
  maxAttendees?: number;
  createdAt?: string;
  updatedAt?: string;
}
