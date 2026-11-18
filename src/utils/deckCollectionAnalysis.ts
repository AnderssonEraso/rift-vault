import { Deck, DeckCardSlot } from '@/types/deck';
import { CardOwnershipSummary } from '@/types/collection';

export interface MissingCardDetail {
  cardId: string;
  name: string;
  imageUrl?: string;
  required: number;
  owned: number;
  missing: number;
  estimatedPriceUsd: number;
  totalMissingCostUsd: number;
  section: string;
}

export interface DeckCollectionAnalysis {
  totalRequiredCards: number;
  totalOwnedCards: number;
  totalMissingCards: number;
  completionPercentage: number;
  isFullyOwned: boolean;
  estimatedMissingCostUsd: number;
  missingCards: MissingCardDetail[];
}

/**
 * Analiza un mazo contrastándolo contra el inventario real de cartas físicas del usuario.
 */
export function analyzeDeckCollection(
  deck: Deck,
  getCardOwnership: (cardId: string) => CardOwnershipSummary
): DeckCollectionAnalysis {
  let totalRequired = 0;
  let totalOwned = 0;
  let totalMissingCost = 0;
  const missingCards: MissingCardDetail[] = [];

  // Función interna para analizar un conjunto de slots
  const processSlots = (slots: DeckCardSlot[] = [], sectionName: string) => {
    for (const slot of slots) {
      const required = slot.count;
      totalRequired += required;

      const ownership = getCardOwnership(slot.cardId);
      const owned = ownership?.totalCopies || 0;
      const countOwnedForSlot = Math.min(required, owned);
      totalOwned += countOwnedForSlot;

      if (owned < required) {
        const missing = required - owned;
        const price =
          slot.card.marketPriceUsd ||
          slot.card.prices?.usd ||
          slot.card.prices?.market ||
          0.25;
        const cost = missing * price;
        totalMissingCost += cost;

        missingCards.push({
          cardId: slot.cardId,
          name: slot.card.name,
          imageUrl: slot.card.imageUrl || slot.card.thumbnailUrl,
          required,
          owned,
          missing,
          estimatedPriceUsd: price,
          totalMissingCostUsd: cost,
          section: sectionName,
        });
      }
    }
  };

  // Analizar Leyenda si existe
  if (deck.legendCard) {
    totalRequired += 1;
    const ownership = getCardOwnership(deck.legendCard.id);
    const owned = ownership?.totalCopies || 0;
    if (owned >= 1) {
      totalOwned += 1;
    } else {
      const price =
        deck.legendCard.marketPriceUsd ||
        deck.legendCard.prices?.usd ||
        deck.legendCard.prices?.market ||
        1.0;
      totalMissingCost += price;
      missingCards.push({
        cardId: deck.legendCard.id,
        name: deck.legendCard.name,
        imageUrl: deck.legendCard.imageUrl || deck.legendCard.thumbnailUrl,
        required: 1,
        owned: 0,
        missing: 1,
        estimatedPriceUsd: price,
        totalMissingCostUsd: price,
        section: 'Leyenda',
      });
    }
  }

  processSlots(deck.battlefields, 'Campos de Batalla');
  processSlots(deck.mainUnits, 'Unidades');
  processSlots(deck.mainSpells, 'Hechizos');
  processSlots(deck.mainGear, 'Equipamiento');
  processSlots(deck.sideboard, 'Banquillo');

  const totalMissingCards = Math.max(0, totalRequired - totalOwned);
  const completionPercentage =
    totalRequired > 0 ? Math.round((totalOwned / totalRequired) * 100) : 100;

  return {
    totalRequiredCards: totalRequired,
    totalOwnedCards: totalOwned,
    totalMissingCards,
    completionPercentage,
    isFullyOwned: totalMissingCards === 0,
    estimatedMissingCostUsd: Number(totalMissingCost.toFixed(2)),
    missingCards,
  };
}
