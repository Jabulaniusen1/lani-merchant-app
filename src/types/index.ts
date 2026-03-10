// Data models matching the Lanieats API

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'RIDER' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  merchant?: Merchant | null;
  rider?: Rider | null;
  avatarUrl?: string;
  name?: string;
}

export interface Merchant {
  id: string;
  userId: string;
  businessName?: string;
  isApproved: boolean;
}

export interface Restaurant {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string | null;
  coverUrl?: string | null;
  isOpen: boolean;
  isApproved: boolean;
  openingTime?: string;
  closingTime?: string;
  rating?: number;
  reviewCount?: number;
  totalReviews?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  restaurantId: string;
  items?: MenuItem[];
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  category?: { id: string; name: string };
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  menuItem?: { id: string; name: string };
  name?: string;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  addressId?: string;
  status: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentRef?: string;
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  total: number;
  totalAmount?: number;
  note?: string;
  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  items?: OrderItem[];
  orderItems?: OrderItem[];
  restaurant?: Restaurant;
  customer?: User;
  user?: User;
  deliveryAddress?: string | { street?: string; city?: string; state?: string; address?: string };
  rider?: RiderProfile | null;
  riderProfile?: RiderProfile | null;
}

export interface RiderProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  isAvailable: boolean;
  isApproved: boolean;
  rating?: number;
  totalReviews?: number;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface Rider {
  id: string;
  userId: string;
  vehicleType?: string;
  vehiclePlate?: string;
  isAvailable: boolean;
  isApproved: boolean;
  rating?: number;
  totalReviews?: number;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
}

// API response wrappers
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Socket event payloads
export interface NewOrderPayload {
  id?: string;
  orderId?: string;
  total: number;
  itemCount: number;
  preview?: string;
  createdAt: string;
}

export interface OrderConfirmedPayload {
  id?: string;
  orderId?: string;
  message: string;
}

export interface OrderCancelledPayload {
  id?: string;
  orderId?: string;
  message: string;
}

export interface RiderAssignedPayload {
  id?: string;
  orderId?: string;
  rider?: RiderProfile;
  message?: string;
}
