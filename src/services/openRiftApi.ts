import { CardsApiResponse, FetchCardsParams, RiftCard } from '@/types/card';

const BASE_URL = 'https://openrift.app/api/v1';
const MEDIA_BASE_URL = 'https://openrift.app/media/cards';

// User-Agent obligatorio solicitado por la documentación de OpenRift
const USER_AGENT = 'RiftVaultApp/1.0 (contact@riftvault.app)';

// Consulta compuesta universal para todos los tipos de cartas de Riftbound
const ALL_TYPES_QUERY = '(t:unit or t:spell or t:gear or t:legend or t:rune)';

/**
 * Resuelve la URL de la imagen WebP oficial según el CDN de OpenRift:
 * https://openrift.app/media/cards/{imageId}-{size}.webp
 * Tamaños soportados por OpenRift: 120w, 240w, 400w, full.
 */
export function buildCardImageUrl(
  imageId?: string,
  size: '120w' | '240w' | '400w' | 'full' = '400w'
): string {
  if (!imageId || imageId === 'undefined') {
    return 'https://via.placeholder.com/400x560/151B26/C8AA6E?text=Riftbound';
  }
  if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
    return imageId;
  }
  return `${MEDIA_BASE_URL}/${imageId}-${size}.webp`;
}

/**
 * Convierte el formato relacional normalizado de OpenRift
 * { printingIds: [...], printings: { [id]: {...} }, cards: { [id]: {...} } }
 * en una lista de objetos RiftCard listos para el renderizado.
 */
function parseOpenRiftResponse(json: any): RiftCard[] {
  // Caso 1: Estructura oficial normalizada de OpenRift (/catalog y /search)
  if (json.printings && typeof json.printings === 'object') {
    const printingIds: string[] = Array.isArray(json.printingIds)
      ? json.printingIds
      : Object.keys(json.printings);

    const result: RiftCard[] = [];

    for (const pId of printingIds) {
      const printing = json.printings[pId];
      if (!printing) continue;

      // Referencia a la entidad card
      const cardData =
        json.cards && printing.cardId ? json.cards[printing.cardId] : {};

      // Extracción del imageId real de cada carta
      const imageId =
        printing.images?.[0]?.imageId ||
        printing.imageId ||
        cardData.images?.[0]?.imageId;

      // Dominios (ej: ["fury", "calm"])
      const rawDomains: string[] = Array.isArray(cardData.domains)
        ? cardData.domains
        : Array.isArray(printing.domains)
        ? printing.domains
        : [];

      const primaryRaw = rawDomains[0] || 'Calm';
      const primaryDomain =
        primaryRaw.charAt(0).toUpperCase() + primaryRaw.slice(1).toLowerCase();

      // Tipos (ej: ["unit"])
      const rawType =
        cardData.types?.[0] ||
        cardData.type ||
        printing.type ||
        'Unit';
      const type =
        rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();

      // Nombre
      const name =
        cardData.name ||
        printing.printedName ||
        'Sin nombre';

      // Rareza
      const rawRarity = String(printing.rarity || cardData.rarity || 'common');
      const rarity =
        rawRarity.charAt(0).toUpperCase() + rawRarity.slice(1).toLowerCase();

      result.push({
        id: pId,
        slug: cardData.slug,
        name,
        publicCode: printing.publicCode || printing.shortCode,
        energyCost: Number(cardData.energy ?? printing.energy ?? 0),
        domains: rawDomains,
        primaryDomain,
        type,
        subtypes: cardData.tags || cardData.superTypes || [],
        rarity,
        rulesText:
          printing.printedRulesText ||
          cardData.rulesText ||
          printing.printedEffectText ||
          '',
        flavorText: printing.flavorText || '',
        power: cardData.power !== undefined ? Number(cardData.power) : undefined,
        health: cardData.might !== undefined ? Number(cardData.might) : undefined,
        imageId,
        thumbnailUrl: buildCardImageUrl(imageId, '400w'),
        highresUrl: buildCardImageUrl(imageId, 'full'),
        prices: printing.prices || undefined,
      });
    }

    return result;
  }

  // Caso 2: Si viene como array simple (cards o data)
  const rawList: any[] = Array.isArray(json)
    ? json
    : Array.isArray(json.cards)
    ? json.cards
    : Array.isArray(json.data)
    ? json.data
    : [];

  return rawList.map((item, idx) => {
    const imageId = item.images?.[0]?.imageId || item.imageId;
    const rawDomains = Array.isArray(item.domains) ? item.domains : [];
    const primaryRaw = rawDomains[0] || 'Calm';
    const primaryDomain =
      primaryRaw.charAt(0).toUpperCase() + primaryRaw.slice(1).toLowerCase();

    return {
      id: String(item.id ?? item.cardId ?? `openrift-${idx}`),
      slug: item.slug,
      name: String(item.name ?? item.printedName ?? 'Sin nombre'),
      publicCode: item.publicCode ?? item.shortCode,
      energyCost: Number(item.energy ?? item.energyCost ?? 0),
      domains: rawDomains,
      primaryDomain,
      type: item.type ?? 'Unit',
      subtypes: item.tags ?? item.subtypes ?? [],
      rarity: item.rarity ?? 'Common',
      rulesText: item.printedRulesText ?? item.rulesText ?? '',
      flavorText: item.flavorText ?? '',
      power: item.power !== undefined ? Number(item.power) : undefined,
      health: item.might !== undefined ? Number(item.might) : undefined,
      imageId,
      thumbnailUrl: buildCardImageUrl(imageId, '400w'),
      highresUrl: buildCardImageUrl(imageId, 'full'),
      prices: item.prices,
    };
  });
}

/**
 * Construye la query compuesta con la sintaxis oficial de OpenRift:
 * Soporta operadores como `d:fury`, `t:unit`, etc.
 */
function buildOpenRiftQuery(query: string, domain?: string, type?: string): string {
  const parts: string[] = [];

  if (query.trim()) {
    parts.push(query.trim());
  }

  if (domain && domain !== 'All') {
    parts.push(`d:${domain.toLowerCase()}`);
  }

  if (type && type !== 'All') {
    parts.push(`t:${type.toLowerCase()}`);
  }

  // Si no hay texto ni filtros específicos ("Todos los Dominios" y "Cualquier Tipo"),
  // OpenRift requiere un parámetro 'q' para no retornar 400.
  // Usamos los 5 tipos válidos con 'or' reconocidos por la API.
  if (parts.length === 0) {
    return ALL_TYPES_QUERY;
  }

  return parts.join(' ').trim();
}

/**
 * Consulta la API real de OpenRift usando los parámetros exactos:
 * unique=cards, order=name, dir=asc, limit, cursor, q
 */
export async function fetchCards(params: FetchCardsParams = {}): Promise<CardsApiResponse> {
  const { cursor = null, limit = 20, query = '', domain = 'All', type = 'All' } = params;

  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set('unique', 'cards');
  url.searchParams.set('order', 'name');
  url.searchParams.set('dir', 'asc');
  url.searchParams.set('limit', String(limit));

  // Siempre se garantiza un 'q' sintácticamente válido
  const composedQuery = buildOpenRiftQuery(query, domain, type);
  url.searchParams.set('q', composedQuery);

  if (cursor && cursor !== 'null') {
    url.searchParams.set('cursor', String(cursor));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Si no hay resultados para ese filtro, la API devuelve 404 (especificación oficial)
    if (response.status === 404) {
      return {
        cards: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      };
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn(`OpenRift HTTP ${response.status} en ${url.toString()}:`, errorText);
      throw new Error(`OpenRift HTTP Error ${response.status}`);
    }

    const json = await response.json();
    const cards = parseOpenRiftResponse(json);
    const nextCursor = json.nextCursor ?? null;

    return {
      cards,
      nextCursor: nextCursor ? String(nextCursor) : null,
      hasMore: Boolean(nextCursor),
      total: json.total ?? cards.length,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn('Fallo al consultar OpenRift:', error?.message || error);
    throw error;
  }
}
