export type TourType = 'adventure' | 'cultural' | 'relaxation' | 'luxury' | 'tour';
export type TourDifficulty = 'easy' | 'moderate' | 'difficult';

export interface Tour {
  id?: string;
  title: string;
  description: string;
  duration: string;
  location: string;
  price: number;
  capacity: number;
  difficulty: TourDifficulty;
  imageUrl: string;
  type: TourType;
  featured: boolean;
  category: string;
  maxAttendees: number;
  includesAccommodation?: boolean;
  includesTransport?: boolean;
  includesMeals?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TourFormData extends Omit<Tour, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional form-specific properties if needed
}
