export type CardDomain =
  | 'All'
  | 'Fury'
  | 'Calm'
  | 'Mind'
  | 'Body'
  | 'Chaos'
  | 'Order';

export type CardType =
  | 'All'
  | 'Unit'
  | 'Spell'
  | 'Gear'
  | 'Legend'
  | 'Rune'
  | 'Battlefield';

export type CardRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface CardPrice {
  usd?: number | null;
  eur?: number | null;
  market?: number | null;
  foil?: number | null;
}

export interface RiftCard {
  id: string;
  slug?: string;
  name: string;
  publicCode?: string;
  energyCost?: number;
  domains: string[];
  primaryDomain: string;
  type?: string;
  cardType?: string;
  subtypes?: string[];
  rarity?: string;
  rulesText?: string;
  flavorText?: string;
  power?: number;
  might?: number;
  health?: number;
  imageId?: string;
  thumbnailUrl?: string;
  highresUrl?: string;
  imageUrl?: string;
  prices?: CardPrice;
  marketPriceUsd?: number;
}

export interface CollectionItem {
  cardId: string;
  card: RiftCard;
  regularCount: number;
  foilCount: number;
  updatedAt: string;
}

export interface CollectionStats {
  uniqueCards: number;
  totalCopies: number;
  totalRegular: number;
  totalFoil: number;
}

export interface CardsApiResponse {
  cards: RiftCard[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface FetchCardsParams {
  cursor?: string | null;
  limit?: number;
  query?: string;
  domain?: CardDomain;
  type?: CardType;
}
