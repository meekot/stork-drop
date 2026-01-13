export interface WishlistItem {
  id: string;
  name: string;
  price?: number;
  url?: string;
  imageUrl?: string;
  category: ItemCategory;
  reservedBy: string | null; // null if available, 'Anonymous' or 'Name' if reserved
  isReserved: boolean;
  notes?: string;
  createdAt: number;
}

export enum ItemCategory {
  ESSENTIALS = 'Essentials',
  CLOTHING = 'Clothing',
  NURSERY = 'Nursery',
  TOYS = 'Toys',
  FEEDING = 'Feeding',
  OTHER = 'Other'
}

export interface ReservationPayload {
  itemId: string;
  name: string; // Empty string implies anonymous
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}
