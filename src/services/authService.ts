// src/services/authService.ts
import axios, { AxiosError } from 'axios';
import { API_V1 } from '../config/env';

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string; // 'admin' | 'staff' | etc, if you use roles
};

export type RegisterResponse = {
  user: { id: string; name: string; email: string; role?: string };
  token?: string;
};

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const base = API_V1.replace(/\/+$/, '');
  try {
    const { data } = await axios.post(`${base}/admin/auth/register`, input, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
      withCredentials: true, // if your backend sets auth cookie
    });
    return data;
  } catch (err) {
    const ax = err as AxiosError<any>;
    const msg =
      ax?.response?.data?.error ||
      ax?.response?.data?.message ||
      ax?.message ||
      'Registration failed';
    throw new Error(msg);
  }
}
