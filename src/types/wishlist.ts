import { RiftCard } from '@/types/card';

export type WishlistPriority = 'alta' | 'media' | 'baja';

export interface WishlistItem {
  id: string;
  userId?: string;
  cardId: string;
  card: RiftCard;
  targetQuantity: number;
  isFoil: boolean;
  priority: WishlistPriority;
  targetPrice?: number | null; // Precio objetivo en USD
  createdAt: string;
  updatedAt?: string;
}

export interface WishlistStats {
  totalItems: number;
  totalCardsCount: number;
  estimatedTotalUsd: number;
  dealsCount: number; // Cartas donde precio actual de mercado <= targetPrice
}
