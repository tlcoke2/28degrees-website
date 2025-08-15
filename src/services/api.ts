// src/services/api.ts
import { AxiosError, AxiosResponse } from 'axios';
import { Tour } from '../types/tour';
import { api } from './http'; // centralized axios with baseURL = VITE_API_URL + '/api/v1'

/* ----------------------------- Types ----------------------------- */
export interface Booking {
  id: string;
  bookingNumber?: string;
  customerName?: string;
  customerEmail?: string;
  tourOrEvent?: { id: string; title: string; type: 'tour' | 'event'; date: string };
  bookingDate?: string;
  status?: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'paid';
  totalAmount?: number;
  paymentStatus?: 'paid' | 'pending' | 'refunded' | 'failed';
  guests?: number;
  specialRequests?: string;
  // Stripe-era fields used in your backend
  itemId?: string;
  itemName?: string;
  quantity?: number;
  date?: string;           // 'YYYY-MM-DD'
  totalCents?: number;
  currency?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | 'guide';
  status?: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  joinDate?: string;
  lastLogin?: string;
}

interface ErrorResponse {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/* ------------------------- Interceptors -------------------------- */
// Attach admin token first, else user
api.interceptors.request.use((config) => {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const userToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const token = adminToken || userToken;
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 → wipe tokens and route user/admin to correct login
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    if (status === 401) {
      const url = (error.response?.config?.url || '').toString();
      const isAdminPath = url.includes('/admin/');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        window.location.href = isAdminPath ? '/admin/login' : '/login';
      }
    }

    const msg =
      (error.response?.data as any)?.message ||
      (error.response?.data as any)?.error ||
      error.message ||
      'An error occurred';

    return Promise.reject({
      message: typeof msg === 'string' ? msg : 'An error occurred',
      status,
      errors: (error.response?.data as any)?.errors,
    } as ErrorResponse);
  }
);

/* --------------------------- Helpers ---------------------------- */
/**
 * Many of your controllers return { status, data: {...} } (e.g., { data: { tours } }).
 * This extractor returns either:
 *  - response.data.data (object), or
 *  - response.data (if it already matches the expected T), or
 *  - undefined for 204.
 */
function extract<T>(res: AxiosResponse<any>): T {
  if (res.status === 204) return undefined as unknown as T;
  const body = res.data;
  if (body && typeof body === 'object' && 'data' in body) {
    return (body.data as T);
  }
  return body as T;
}

// Build query string safely
const toQuery = (obj: Record<string, any>) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

/* ----------------------------- Auth ----------------------------- */
export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const token = res.data?.token ?? res.data?.data?.token;
    const user = res.data?.user ?? res.data?.data?.user;
    if (!token) throw { message: 'No token returned from server' } as ErrorResponse;
    return { token, user } as { token: string; user: User };
  },

  register: async (userData: { name: string; email: string; password: string }) => {
    // backend expects passwordConfirm as well
    const res = await api.post('/auth/register', {
      ...userData,
      passwordConfirm: userData.password,
    });
    const token = res.data?.token ?? res.data?.data?.token;
    const user = res.data?.user ?? res.data?.data?.user;
    if (!token) throw { message: 'No token returned from server' } as ErrorResponse;
    return { token, user } as { token: string; user: User };
  },

  // Use /users/me (your users router provides this via getMe -> getUser)
  getCurrentUser: async () => {
    const res = await api.get('/users/me');
    const payload = extract<{ user: User }>(res);
    return payload.user;
  },

  logout: async () => {
    // your route is GET /auth/logout
    await api.get('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
  },

  changePassword: async (passwordCurrent: string, password: string) => {
    const res = await api.patch('/auth/updateMyPassword', {
      passwordCurrent,
      password,
      passwordConfirm: password,
    });
    return extract<any>(res);
  },

  requestPasswordReset: async (email: string) => {
    const res = await api.post('/auth/forgotPassword', { email });
    return extract<any>(res);
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await api.patch(`/auth/resetPassword/${encodeURIComponent(token)}`, {
      password: newPassword,
      passwordConfirm: newPassword,
    });
    return extract<any>(res);
  },
};

/* ----------------------------- Tours ---------------------------- */
export const tourService = {
  getAllTours: async (): Promise<Tour[]> => {
    const res = await api.get('/tours');
    const data = extract<{ tours: Tour[] }>(res);
    return data.tours;
  },

  getTourById: async (id: string): Promise<Tour> => {
    const res = await api.get(`/tours/${id}`);
    const data = extract<{ tour: Tour }>(res);
    return data.tour;
  },

  createTour: async (tourData: Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tour> => {
    const res = await api.post('/tours', tourData);
    const data = extract<{ tour: Tour }>(res);
    return data.tour;
  },

  updateTour: async (id: string, tourData: Partial<Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tour> => {
    const res = await api.patch(`/tours/${id}`, tourData);
    const data = extract<{ tour: Tour }>(res);
    return data.tour;
  },

  deleteTour: async (id: string): Promise<void> => {
    const res = await api.delete(`/tours/${id}`);
    return extract<void>(res);
  },
};

/* ---------------------------- Bookings --------------------------- */
export const bookingService = {
  // Admin list (your controller: getAllBookings)
  getAllBookings: async (filters: Record<string, any> = {}) => {
    const qs = toQuery(filters);
    const res = await api.get(`/bookings${qs ? `?${qs}` : ''}`);
    const data = extract<{ bookings: Booking[] }>(res);
    return data.bookings;
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const res = await api.get(`/bookings/${id}`);
    const data = extract<{ booking: Booking }>(res);
    return data.booking;
  },

  // Admin create (your controller: createBooking)
  createBooking: async (bookingData: Partial<Booking>): Promise<Booking> => {
    const res = await api.post('/bookings', bookingData);
    const data = extract<{ booking: Booking }>(res);
    return data.booking;
  },

  // Update arbitrary fields (status, etc.)
  updateBooking: async (id: string, bookingData: Partial<Booking>): Promise<Booking> => {
    const res = await api.patch(`/bookings/${id}`, bookingData);
    const data = extract<{ booking: Booking }>(res);
    return data.booking;
  },

  // Dedicated cancel endpoint per your controller
  cancelBooking: async (id: string): Promise<Booking> => {
    const res = await api.patch(`/bookings/${id}/cancel`);
    const data = extract<{ booking: Booking }>(res);
    return data.booking;
  },

  // My bookings (your controller: getMyBookings)
  getMyBookings: async (): Promise<Booking[]> => {
    const res = await api.get('/bookings/my-bookings');
    const data = extract<{ bookings: Booking[] }>(res);
    return data.bookings;
  },

  deleteBooking: async (id: string): Promise<void> => {
    const res = await api.delete(`/bookings/${id}`);
    return extract<void>(res);
  },
};

/* ------------------------------ Users --------------------------- */
export const userService = {
  getAllUsers: async (filters: Partial<User> = {}) => {
    const qs = toQuery(filters);
    const res = await api.get(`/users${qs ? `?${qs}` : ''}`);
    const data = extract<{ users: User[] }>(res);
    return data.users;
  },

  getUserById: async (id: string): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    const data = extract<{ user: User }>(res);
    return data.user;
  },

  createUser: async (userData: Partial<User> & { password: string }): Promise<User> => {
    const payload: any = { ...userData, passwordConfirm: userData.password };
    const res = await api.post('/users', payload);
    const data = extract<{ user: User }>(res);
    return data.user;
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    const res = await api.patch(`/users/${id}`, userData);
    const data = extract<{ user: User }>(res);
    return data.user;
  },

  deleteUser: async (id: string): Promise<void> => {
    const res = await api.delete(`/users/${id}`);
    return extract<void>(res);
  },

  // Profile
  getProfile: async (): Promise<User> => {
    const res = await api.get('/users/me');
    const data = extract<{ user: User }>(res);
    return data.user;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const res = await api.patch('/users/updateMe', userData);
    const data = extract<{ user: User }>(res);
    return data.user;
  },

  deleteMe: async (): Promise<void> => {
    const res = await api.delete('/users/deleteMe');
    return extract<void>(res);
  },
};

export default api;

