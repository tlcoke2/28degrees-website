export type EventType = 'concert' | 'festival' | 'exhibition' | 'workshop' | 'other';
export type EventCategory = 'general' | 'music' | 'sports' | 'food' | 'arts';

export interface Event {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  imageUrl: string;
  type: EventType;
  category: EventCategory;
  featured: boolean;
  capacity: number;
  includesAccommodation?: boolean;
  includesTransport?: boolean;
  includesMeals?: boolean;
  maxAttendees?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventFormData extends Omit<Event, 'id' | 'createdAt' | 'updatedAt'> {
  time: string;
  category: EventCategory;
}
