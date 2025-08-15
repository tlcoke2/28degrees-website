import { api } from './http'; // baseURL = VITE_API_BASE_URL + '/api/v1'

export type HomeContent = {
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  featured?: Array<{ title: string; description?: string; imageUrl?: string; link?: string }>;
};

export type AboutContent = {
  title?: string;
  subtitle?: string;
  body?: string;           // HTML or markdown (your choice)
  bannerImageUrl?: string;
  team?: Array<{ name: string; role?: string; photoUrl?: string; bio?: string }>;
};

export type PageContent<T = any> = { page: 'home' | 'about'; data: T };

export const contentService = {
  get: async <T = any>(page: 'home' | 'about'): Promise<PageContent<T>> => {
    const res = await api.get<{ data: PageContent<T> }>(`/content/${page}`);
    return res.data.data;
  },

  getAdmin: async <T = any>(page: 'home' | 'about'): Promise<PageContent<T>> => {
    const res = await api.get<{ data: PageContent<T> }>(`/content/${page}/admin`);
    return res.data.data;
  },

  save: async <T = any>(page: 'home' | 'about', data: T): Promise<PageContent<T>> => {
    const res = await api.put<{ data: PageContent<T> }>(`/content/${page}`, { data });
    return res.data.data;
  },
};
