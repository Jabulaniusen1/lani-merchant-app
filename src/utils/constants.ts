import type { OrderStatus } from '../types';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:8000';
export const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
export const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'lanieats_merchants';

export interface NigerianCity {
  label: string;
  value: string;
  state: string;
}

export const NIGERIAN_CITIES: NigerianCity[] = [
  { label: 'Lagos', value: 'Lagos', state: 'Lagos' },
  { label: 'Abuja', value: 'Abuja', state: 'FCT' },
  { label: 'Port Harcourt', value: 'Port Harcourt', state: 'Rivers' },
  { label: 'Ibadan', value: 'Ibadan', state: 'Oyo' },
  { label: 'Kano', value: 'Kano', state: 'Kano' },
  { label: 'Enugu', value: 'Enugu', state: 'Enugu' },
  { label: 'Benin City', value: 'Benin City', state: 'Edo' },
  { label: 'Uyo', value: 'Uyo', state: 'Akwa Ibom' },
];

export const ORDER_STATUS: Record<OrderStatus, OrderStatus> = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_FILTER_TABS: Array<'ALL' | OrderStatus> = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'DELIVERED',
  'CANCELLED',
];
