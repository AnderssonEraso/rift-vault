import { RiftCard } from '@/types/card';

export interface DeckCardSlot {
  cardId: string;
  card: RiftCard;
  count: number;
  isOwned?: boolean;
}

export interface DeckRuneSlot {
  id: string;
  domain: string;
  count: number;
  iconName?: string;
}

export interface DeckLegality {
  isValid: boolean;
  errors: string[];
  legendValid: boolean;
  championUnitValid?: boolean;
  runesValid: boolean;
  battlefieldsValid: boolean;
  mainDeckValid: boolean;
  sideboardValid: boolean;
  copiesValid: boolean;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  legendCard?: RiftCard;
  championUnit?: RiftCard; // Unidad Campeón de la Leyenda
  domains: string[];
  viewsCount: number;
  isPublic: boolean;
  priceUsd: number;
  
  // Personalización visual del mazo
  color?: string; // Color hex de acento (ej. #3B82F6, #EF4444)
  icon?: string; // Nombre del icono de Ionicons (ej. 'flame', 'sparkles')

  // Estructura oficial del reglamento Riftbound
  runes: DeckRuneSlot[]; // Debe sumar exactamente 12
  battlefields: DeckCardSlot[]; // Debe sumar exactamente 3
  mainUnits: DeckCardSlot[]; // Unidades en mazo principal
  mainGear: DeckCardSlot[]; // Gear en mazo principal
  mainSpells: DeckCardSlot[]; // Hechizos en mazo principal
  sideboard: DeckCardSlot[]; // Máximo 10 cartas
  maybeboard: DeckCardSlot[]; // Máximo 100 cartas (En consideración)

  createdAt: string;
  updatedAt: string;
}

export interface DeckStats {
  totalCards: number;
  unitsCount: number;
  spellsCount: number;
  gearsCount: number;
  battlefieldsCount: number;
  runesCount: number;
  sideboardCount: number;
  maybeboardCount: number;
  manaCurve: Record<number, number>;
  estimatedDeckValueUsd: number;
  legality: DeckLegality;
}
