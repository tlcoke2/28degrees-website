import axios from 'axios';
import { API_V1 } from '../config/env';

export type CatalogType = 'tour' | 'event' | 'vip' | 'product';

export interface CatalogItem {
  id: string;
  type: CatalogType;
  name: string;
  priceCents: number;
}

export async function fetchCatalog(): Promise<CatalogItem[]> {
  const { data } = await axios.get(`${API_V1}/catalog`, { withCredentials: true });
  return (data?.items ?? []) as CatalogItem[];
}
