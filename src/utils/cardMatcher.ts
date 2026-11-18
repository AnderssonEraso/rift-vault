import { RiftCard } from '@/types/card';

export interface CardMatchCandidate {
  card: RiftCard;
  score: number; // 0 - 100
  matchedField: 'name' | 'slug' | 'publicCode' | 'subtypes';
}

export interface CardMatchResult {
  bestMatch: RiftCard | null;
  confidence: number; // 0 - 100
  candidates: CardMatchCandidate[];
  query: string;
  isHighConfidence: boolean; // confidence >= 70%
}

/**
 * Normaliza una cadena para comparaciones de texto en TCG:
 * - Convierte a minúsculas
 * - Remueve acentos y diacríticos
 * - Elimina caracteres no alfanuméricos redundantes
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, ' ') // Dejar solo letras, números y espacios
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Distancia de Levenshtein entre dos cadenas
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];

  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          matrix[i][j - 1] + 1, // inserción
          matrix[i - 1][j] + 1 // eliminación
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Coeficiente de similitud de Dice (Bigramas):
 * Ideal para coincidencias difusas rápidas con tolerancia a ruido de cámara/OCR
 */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const getBigrams = (str: string): Map<string, number> => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    return bigrams;
  };

  const aBigrams = getBigrams(a);
  const bBigrams = getBigrams(b);

  let intersection = 0;
  for (const [bigram, countA] of aBigrams.entries()) {
    const countB = bBigrams.get(bigram);
    if (countB) {
      intersection += Math.min(countA, countB);
    }
  }

  const total = a.length - 1 + (b.length - 1);
  return (2 * intersection) / total;
}

/**
 * Calcula un puntaje de similitud combinado (0 a 100)
 */
export function computeSimilarityScore(inputQuery: string, targetName: string): number {
  const normInput = normalizeText(inputQuery);
  const normTarget = normalizeText(targetName);

  if (!normInput || !normTarget) return 0;
  if (normInput === normTarget) return 100;

  // Coincidencia exacta de prefijo o subcadena completa
  if (normTarget.startsWith(normInput) || normInput.startsWith(normTarget)) {
    const minLen = Math.min(normInput.length, normTarget.length);
    const maxLen = Math.max(normInput.length, normTarget.length);
    return Math.round(85 + (minLen / maxLen) * 15);
  }

  if (normTarget.includes(normInput) && normInput.length >= 4) {
    return Math.round(80 + (normInput.length / normTarget.length) * 15);
  }

  // Token matching (coincidencia por palabras individuales)
  const inputTokens = normInput.split(' ').filter(t => t.length > 2);
  const targetTokens = normTarget.split(' ').filter(t => t.length > 2);

  let matchingTokens = 0;
  for (const token of inputTokens) {
    if (targetTokens.some(tt => tt.includes(token) || token.includes(tt))) {
      matchingTokens++;
    }
  }

  const tokenRatio =
    inputTokens.length > 0 ? matchingTokens / Math.max(inputTokens.length, targetTokens.length) : 0;

  // Dice coefficient
  const dice = diceCoefficient(normInput, normTarget);

  // Levenshtein ratio
  const maxLen = Math.max(normInput.length, normTarget.length);
  const lev = maxLen > 0 ? 1 - levenshteinDistance(normInput, normTarget) / maxLen : 0;

  // Ponderación combinada
  const combined = dice * 0.45 + tokenRatio * 0.35 + lev * 0.2;
  return Math.round(Math.min(100, Math.max(0, combined * 100)));
}

/**
 * Busca y clasifica las cartas del catálogo que mejor coincidan con el texto extraído
 */
export function matchCardFromText(
  extractedText: string,
  catalog: RiftCard[],
  minThreshold = 35
): CardMatchResult {
  const trimmed = extractedText.trim();
  if (!trimmed || !catalog || catalog.length === 0) {
    return {
      bestMatch: null,
      confidence: 0,
      candidates: [],
      query: trimmed,
      isHighConfidence: false,
    };
  }

  const normalizedQuery = normalizeText(trimmed);
  const candidates: CardMatchCandidate[] = [];

  for (const card of catalog) {
    // 1. Verificación por código público (ej. "RF-001")
    if (card.publicCode && normalizeText(card.publicCode) === normalizedQuery) {
      candidates.push({ card, score: 100, matchedField: 'publicCode' });
      continue;
    }

    // 2. Verificación por Slug
    if (card.slug && normalizeText(card.slug) === normalizedQuery) {
      candidates.push({ card, score: 98, matchedField: 'slug' });
      continue;
    }

    // 3. Similitud por Nombre
    const nameScore = computeSimilarityScore(trimmed, card.name);
    if (nameScore >= minThreshold) {
      candidates.push({ card, score: nameScore, matchedField: 'name' });
      continue;
    }

    // 4. Verificación por subtipos (ej. Campeón, Yordle, Dragón)
    if (card.subtypes && card.subtypes.length > 0) {
      for (const subtype of card.subtypes) {
        const subtypeScore = computeSimilarityScore(trimmed, subtype);
        if (subtypeScore >= 80) {
          candidates.push({
            card,
            score: Math.round(subtypeScore * 0.7),
            matchedField: 'subtypes',
          });
          break;
        }
      }
    }
  }

  // Ordenar candidatos por mayor puntaje
  candidates.sort((a, b) => b.score - a.score);

  // Limitar a los 5 mejores candidatos
  const topCandidates = candidates.slice(0, 5);
  const best = topCandidates[0] || null;
  const confidence = best ? best.score : 0;

  return {
    bestMatch: best ? best.card : null,
    confidence,
    candidates: topCandidates,
    query: trimmed,
    isHighConfidence: confidence >= 70,
  };
}

/**
 * Analiza un bloque multilínea de OCR (típico de una captura de cámara)
 * evaluando cada línea como potencial título de carta.
 */
export function matchCardFromMultiLineText(
  lines: string[],
  catalog: RiftCard[]
): CardMatchResult {
  let highestConfidenceResult: CardMatchResult = {
    bestMatch: null,
    confidence: 0,
    candidates: [],
    query: '',
    isHighConfidence: false,
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length < 3) continue;

    const result = matchCardFromText(line, catalog);
    if (result.confidence > highestConfidenceResult.confidence) {
      highestConfidenceResult = result;
      if (result.confidence >= 90) break; // Coincidencia casi perfecta
    }
  }

  return highestConfidenceResult;
}
