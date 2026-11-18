import { Deck } from '@/types/deck';

export type DeckTier = 'S' | 'A' | 'B' | 'C';

export type CommunityDeckSort = 'recent' | 'likes' | 'tier';

export interface CommunityDeck {
  id: string;
  userId?: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  description?: string;
  deckCode?: string;
  deckData: Deck;
  legendName?: string;
  legendImageUrl?: string;
  primaryDomain: string;
  domains: string[];
  tags: string[]; // 'Competitivo', 'Budget', 'Fun', 'Aggro', 'Control', etc.
  priceUsd: number;
  likesCount: number;
  clonesCount: number;
  tier?: DeckTier | null;
  createdAt: string;
  updatedAt: string;
  isLikedByMe?: boolean;
}

export interface MetaTierItem {
  id: string;
  archetypeName: string;
  tier: DeckTier;
  legendName: string;
  legendImageUrl?: string;
  primaryDomain: string;
  secondaryDomain?: string;
  popularityPercent: number;
  winratePercent: number;
  playstyle?: string;
  keyCards: string[];
  description?: string;
  sampleDeckId?: string;
  sampleDeckCode?: string;
  updatedAt: string;
}

export interface CommunityDeckFilter {
  domain?: string;
  tag?: string;
  legend?: string;
  sortBy?: CommunityDeckSort;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PublishDeckInput {
  deck: Deck;
  title?: string;
  description?: string;
  tags?: string[];
  authorName?: string;
}
