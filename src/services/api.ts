import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Tour } from '../types/tour';

// Type definitions for Bookings and Users
export interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  tourOrEvent: {
    id: string;
    title: string;
    type: 'tour' | 'event';
    date: string;
  };
  bookingDate: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'failed';
  guests: number;
  specialRequests?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | 'guide';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  joinDate: string;
  lastLogin?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Get API base URL from environment variables or use default
const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Define API response types
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string | Record<string, string[]>;
}

// Define auth response type
interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Define error response type
interface ErrorResponse {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.status >= 200 && response.status < 300) {
    return (response.data as ApiResponse<T>).data;
  }
  
  const responseData = response.data as ApiResponse;
  const error: ErrorResponse = {
    message: typeof responseData.message === 'string' ? responseData.message : 'An error occurred',
    status: response.status,
    errors: typeof responseData.error === 'object' && responseData.error !== null 
      ? responseData.error as Record<string, string[]> 
      : undefined,
  };
  
  throw error;
};

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    if (error.response?.data) {
      return Promise.reject({
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        errors: (error.response.data as any).errors,
      });
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return handleResponse<AuthResponse>(response);
  },
  
  register: async (userData: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return handleResponse<AuthResponse>(response);
  },
  
  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    const response = await api.get('/auth/me');
    return handleResponse<{ user: AuthResponse['user'] }>(response).user;
  },
  
  logout: (): void => {
    localStorage.removeItem('token');
  },
};

export const tourService = {
  getAllTours: async (): Promise<Tour[]> => {
    const response = await api.get('/tours');
    return handleResponse<Tour[]>(response);
  },
  
  getTourById: async (id: string): Promise<Tour> => {
    const response = await api.get(`/tours/${id}`);
    return handleResponse<Tour>(response);
  },
  
  createTour: async (tourData: Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tour> => {
    const response = await api.post('/tours', tourData);
    return handleResponse<Tour>(response);
  },
  
  updateTour: async (id: string, tourData: Partial<Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tour> => {
    const response = await api.put(`/tours/${id}`, tourData);
    return handleResponse<Tour>(response);
  },
  
  deleteTour: async (id: string): Promise<void> => {
    await api.delete(`/tours/${id}`);
  },
};

export const eventService = {
  getAllEvents: async () => {
    const response = await api.get('/events');
    return response.data;
  },
  getEventById: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  createEvent: async (eventData: any) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },
  updateEvent: async (id: string, eventData: any) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },
  deleteEvent: async (id: string) => {
    await api.delete(`/events/${id}`);
  },
};

export const bookingService = {
  /**
   * Get all bookings with optional pagination and filters
   */
  getAllBookings(page = 1, limit = 10, filters: Record<string, any> = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return api.get<ApiResponse<PaginatedResponse<Booking>>>(`/bookings?${params}`).then(handleResponse);
  },

  /**
   * Get a single booking by ID
   */
  getBookingById(id: string): Promise<Booking> {
    return api.get<ApiResponse<Booking>>(`/bookings/${id}`).then(handleResponse);
  },

  /**
   * Create a new booking
   */
  createBooking(bookingData: Omit<Booking, 'id' | 'bookingNumber' | 'bookingDate' | 'status' | 'paymentStatus'>): Promise<Booking> {
    return api.post<ApiResponse<Booking>>('/bookings', bookingData).then(handleResponse);
  },

  /**
   * Update booking status
   */
  updateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
    return api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status }).then(handleResponse);
  },

  /**
   * Update booking details
   */
  updateBooking(id: string, bookingData: Partial<Omit<Booking, 'id' | 'bookingNumber' | 'bookingDate'>>): Promise<Booking> {
    return api.put<ApiResponse<Booking>>(`/bookings/${id}`, bookingData).then(handleResponse);
  },

  /**
   * Cancel a booking
   */
  cancelBooking(id: string): Promise<void> {
    return api.delete<ApiResponse<void>>(`/bookings/${id}`).then(handleResponse);
  },

  /**
   * Get bookings for the current user
   */
  getMyBookings(): Promise<Booking[]> {
    return api.get<ApiResponse<Booking[]>>('/bookings/me').then(handleResponse);
  },
};

export const userService = {
  /**
   * Get all users with optional pagination and filters
   */
  getAllUsers(page = 1, limit = 10, filters: Partial<User> = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return api.get<ApiResponse<PaginatedResponse<User>>>(`/users?${params}`).then(handleResponse);
  },

  /**
   * Get a single user by ID
   */
  getUserById(id: string): Promise<User> {
    return api.get<ApiResponse<User>>(`/users/${id}`).then(handleResponse);
  },

  /**
   * Create a new user (admin only)
   */
  createUser(userData: Omit<User, 'id' | 'joinDate' | 'lastLogin' | 'status'> & { password: string }): Promise<User> {
    return api.post<ApiResponse<User>>('/users', userData).then(handleResponse);
  },

  /**
   * Update user details
   */
  updateUser(id: string, userData: Partial<Omit<User, 'id' | 'joinDate' | 'lastLogin'>>): Promise<User> {
    return api.put<ApiResponse<User>>(`/users/${id}`, userData).then(handleResponse);
  },

  /**
   * Update user role (admin only)
   */
  updateUserRole(id: string, role: User['role']): Promise<User> {
    return api.patch<ApiResponse<User>>(`/users/${id}/role`, { role }).then(handleResponse);
  },

  /**
   * Update user status (admin only)
   */
  updateUserStatus(id: string, status: User['status']): Promise<User> {
    return api.patch<ApiResponse<User>>(`/users/${id}/status`, { status }).then(handleResponse);
  },

  /**
   * Delete a user (admin only)
   */
  deleteUser(id: string): Promise<void> {
    return api.delete<ApiResponse<void>>(`/users/${id}`).then(handleResponse);
  },

  /**
   * Get current user profile
   */
  getProfile(): Promise<User> {
    return api.get<ApiResponse<User>>('/users/me').then(handleResponse);
  },

  /**
   * Update current user profile
   */
  updateProfile(userData: Partial<Omit<User, 'id' | 'role' | 'joinDate' | 'lastLogin' | 'status'>>): Promise<User> {
    return api.put<ApiResponse<User>>('/users/me', userData).then(handleResponse);
  },

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return api.post<ApiResponse<void>>('/users/change-password', { currentPassword, newPassword }).then(handleResponse);
  },

  /**
   * Request password reset
   */
  requestPasswordReset(email: string): Promise<void> {
    return api.post<ApiResponse<void>>('/users/request-password-reset', { email }).then(handleResponse);
  },

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Promise<void> {
    return api.post<ApiResponse<void>>('/users/reset-password', { token, newPassword }).then(handleResponse);
  },
};

export default api;
