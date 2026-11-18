import { RiftCard } from '@/types/card';

export interface TradeCardItem {
  id: string;
  card: RiftCard;
  count: number;
  unitPriceUsd: number;
}

export interface TradeSummary {
  myTotal: number;
  theirTotal: number;
  difference: number;
  favorsMe: boolean;
  isFair: boolean;
  fairnessMessage: string;
}
