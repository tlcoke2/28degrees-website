export interface Tour {
  id?: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  imageUrl: string;
  type: 'adventure' | 'cultural' | 'relaxation' | 'luxury';
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
}
