export interface WishlistItem {
  id: string;
  name: string;
  price?: number;
  currency?: string;
  url?: string;
  imageUrl?: string;
  reservedBy: string | null; // null if available, 'Anonymous' or 'Name' if reserved
  isReserved: boolean;
  notes?: string;
  createdAt: number;
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
