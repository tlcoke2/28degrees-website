export interface Event {
  id?: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  imageUrl: string;
  type: 'concert' | 'festival' | 'exhibition' | 'workshop' | 'other';
  featured: boolean;
  capacity: number;
  createdAt?: string;
  updatedAt?: string;
}
