import { Deck, DeckLegality, DeckStats } from '@/types/deck';

/**
 * Validador oficial de reglamento de Riftbound TCG:
 * 1. Leyenda: exactamente 1 carta (1/1).
 * 2. Runas: exactamente 12 runas (12/12).
 * 3. Campos de batalla: exactamente 3 cartas (3/3).
 * 4. Mazo principal: exactamente 40 cartas (40/40) (Unidades + Gear + Hechizos).
 * 5. Mazo secundario: máximo 10 cartas (<=10).
 * 6. Máximo 3 copias de una misma carta en el mazo.
 */
export function validateRiftDeck(deck: Deck): DeckLegality {
  const errors: string[] = [];

  const legendValid = !!deck.legendCard;
  if (!legendValid) {
    errors.push('Falta la carta de Leyenda (debe ser 1/1).');
  }

  const totalRunes = (deck.runes || []).reduce((acc, r) => acc + r.count, 0);
  const runesValid = totalRunes === 12;
  if (!runesValid) {
    errors.push(`Runas insuficientes o excedidas: ${totalRunes}/12.`);
  }

  const totalBattlefields = (deck.battlefields || []).reduce((acc, b) => acc + b.count, 0);
  const battlefieldsValid = totalBattlefields === 3;
  if (!battlefieldsValid) {
    errors.push(`Campos de batalla incompletos: ${totalBattlefields}/3.`);
  }

  const totalUnits = (deck.mainUnits || []).reduce((acc, u) => acc + u.count, 0);
  const totalGear = (deck.mainGear || []).reduce((acc, g) => acc + g.count, 0);
  const totalSpells = (deck.mainSpells || []).reduce((acc, s) => acc + s.count, 0);
  const totalMainDeck = totalUnits + totalGear + totalSpells;

  const mainDeckValid = totalMainDeck === 40;
  if (!mainDeckValid) {
    errors.push(`El mazo principal debe tener exactamente 40 cartas (actual: ${totalMainDeck}/40).`);
  }

  const totalSideboard = (deck.sideboard || []).reduce((acc, s) => acc + s.count, 0);
  const sideboardValid = totalSideboard <= 10;
  if (!sideboardValid) {
    errors.push(`Mazo secundario excede el límite permitido: ${totalSideboard}/10.`);
  }

  // Comprobar límite de 3 copias por carta
  let copiesValid = true;
  const copyCounts: Record<string, number> = {};

  const allMainCards = [
    ...(deck.mainUnits || []),
    ...(deck.mainGear || []),
    ...(deck.mainSpells || []),
    ...(deck.sideboard || []),
  ];

  for (const item of allMainCards) {
    const key = item.card.name;
    copyCounts[key] = (copyCounts[key] || 0) + item.count;
    if (copyCounts[key] > 3) {
      copiesValid = false;
      errors.push(`Máximo 3 copias permitidas de "${item.card.name}" (tienes ${copyCounts[key]}).`);
    }
  }

  const isValid =
    legendValid &&
    runesValid &&
    battlefieldsValid &&
    mainDeckValid &&
    sideboardValid &&
    copiesValid;

  return {
    isValid,
    errors,
    legendValid,
    runesValid,
    battlefieldsValid,
    mainDeckValid,
    sideboardValid,
    copiesValid,
  };
}

export function calculateDeckStats(deck: Deck): DeckStats {
  const unitsCount = (deck.mainUnits || []).reduce((acc, u) => acc + u.count, 0);
  const gearsCount = (deck.mainGear || []).reduce((acc, g) => acc + g.count, 0);
  const spellsCount = (deck.mainSpells || []).reduce((acc, s) => acc + s.count, 0);
  const battlefieldsCount = (deck.battlefields || []).reduce((acc, b) => acc + b.count, 0);
  const runesCount = (deck.runes || []).reduce((acc, r) => acc + r.count, 0);
  const sideboardCount = (deck.sideboard || []).reduce((acc, s) => acc + s.count, 0);
  const maybeboardCount = (deck.maybeboard || []).reduce((acc, m) => acc + m.count, 0);

  const totalCards = unitsCount + gearsCount + spellsCount;

  const manaCurve: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const allCards = [...(deck.mainUnits || []), ...(deck.mainGear || []), ...(deck.mainSpells || [])];

  for (const item of allCards) {
    const cost = item.card.energyCost || 1;
    const bucket = cost >= 6 ? 6 : cost;
    manaCurve[bucket] = (manaCurve[bucket] || 0) + item.count;
  }

  const legality = validateRiftDeck(deck);

  return {
    totalCards,
    unitsCount,
    spellsCount,
    gearsCount,
    battlefieldsCount,
    runesCount,
    sideboardCount,
    maybeboardCount,
    manaCurve,
    estimatedDeckValueUsd: deck.priceUsd || 0,
    legality,
  };
}
