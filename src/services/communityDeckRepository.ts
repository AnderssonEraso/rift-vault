import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import {
  CommunityDeck,
  MetaTierItem,
  CommunityDeckFilter,
  PublishDeckInput,
} from '@/types/community';
import { exportDeckToCode } from '@/utils/deckExportImport';

const DECKS_CACHE_KEY = '@riftdex_community_decks_cache';
const TIER_CACHE_KEY = '@riftdex_meta_tier_cache';
const LIKES_CACHE_KEY = '@riftdex_liked_deck_ids';

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

// Datos semilla de arquetipos para el Meta Tier List
export const SEED_META_TIERS: MetaTierItem[] = [
  {
    id: 'meta-tier-vi',
    archetypeName: 'Vi Hextech Blitz Aggro',
    tier: 'S',
    legendName: 'Vi, Destructora de Piltover',
    legendImageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/vi.png',
    primaryDomain: 'fury',
    popularityPercent: 24.5,
    winratePercent: 58.2,
    playstyle: 'Aggro Rápido',
    keyCards: ['Golpe Demoledor', 'Núcleo Hextech Acelerado', 'Fuerza Imparable'],
    description: 'Presión máxima en curva temprana. Castiga a mazos lentos con ataques directos a runas.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'meta-tier-zed',
    archetypeName: 'Zed Sombras Asesinas',
    tier: 'S',
    legendName: 'Zed, Maestro de las Sombras',
    legendImageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/zed.png',
    primaryDomain: 'mind',
    popularityPercent: 19.8,
    winratePercent: 56.4,
    playstyle: 'Combo / Evasión',
    keyCards: ['Sombra Viviente', 'Cuchillada Sombría', 'Marca de la Muerte'],
    description: 'Alta movilidad táctica con unidades elusivas y multiplicación de copias en mesa.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'meta-tier-aatrox',
    archetypeName: 'Aatrox Ruina Oscura',
    tier: 'A',
    legendName: 'Aatrox, la Espada de los Oscuros',
    legendImageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/aatrox.png',
    primaryDomain: 'chaos',
    popularityPercent: 15.2,
    winratePercent: 53.7,
    playstyle: 'Midrange Sostenido',
    keyCards: ['Espada Darkin', 'Matarreyes', 'Furia Maldita'],
    description: 'Robusto y resiliente. Convierte el daño recibido en recursos y curación en mesa.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'meta-tier-ahri',
    archetypeName: 'Ahri Encanto Espiritual',
    tier: 'A',
    legendName: 'Ahri, la Zorra de Nueve Colas',
    legendImageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/ahri.png',
    primaryDomain: 'calm',
    popularityPercent: 14.1,
    winratePercent: 52.8,
    playstyle: 'Control / Desgaste',
    keyCards: ['Orbe del Engaño', 'Fuego Zorro', 'Viento Envolvente'],
    description: 'Control de tempo, congelaciones tácticas y generación de valor en turnos medios.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'meta-tier-garen',
    archetypeName: 'Garen Baluarte de Demacia',
    tier: 'B',
    legendName: 'Garen, Poder de Demacia',
    legendImageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/garen.png',
    primaryDomain: 'order',
    popularityPercent: 11.3,
    winratePercent: 50.1,
    playstyle: 'Defensivo / Budget',
    keyCards: ['Juicio Justo', 'Escudo de Coraje', 'Vanguardia Implacable'],
    description: 'Económico y consistente. Tropas de alto aguante que protegen las runas eficazmente.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'meta-tier-malphite',
    archetypeName: 'Malphite Firmeza Titánica',
    tier: 'B',
    legendName: 'Malphite, Fragmento del Monolito',
    legendImageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/malphite.png',
    primaryDomain: 'body',
    popularityPercent: 8.9,
    winratePercent: 49.2,
    playstyle: 'Ramp / Late Game',
    keyCards: ['Fuerza de la Tierra', 'Avalancha Rúnica', 'Impacto Sísmico'],
    description: 'Acelerador de maná para invocar criaturas devastadoras en los turnos 5+.',
    updatedAt: new Date().toISOString(),
  },
];

// Mazos semilla iniciales para el Hub Comunitario
export const SEED_COMMUNITY_DECKS: CommunityDeck[] = [
  {
    id: 'comm-deck-1',
    authorName: 'ProRift_Carlos',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    title: 'Vi Aggro Rush (Campeón Regional Valencia)',
    description: 'Guía rápida: En turno 1 prioriza Forjador de Zaun. Ataca sin miedo para vaciar tu mano antes de turno 4.',
    deckCode: 'RIFT1-VI-AGGRO-SPAIN-01',
    deckData: {
      id: 'comm-deck-1',
      name: 'Vi Aggro Rush',
      legendCard: {
        id: 'vi-01',
        name: 'Vi, Destructora de Piltover',
        primaryDomain: 'fury',
        domains: ['fury'],
        imageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/vi.png',
        energyCost: 3,
        might: 5,
        health: 4,
      },
      domains: ['fury'],
      viewsCount: 248,
      isPublic: true,
      priceUsd: 18.5,
      runes: [
        { id: 'r1', domain: 'fury', count: 12 },
      ],
      battlefields: [
        {
          cardId: 'bf-1',
          count: 3,
          card: {
            id: 'bf-1',
            name: 'Puente del Progreso',
            primaryDomain: 'fury',
            domains: ['fury'],
            type: 'Battlefield',
            imageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/bridge.png',
          },
        },
      ],
      mainUnits: [
        {
          cardId: 'unit-1',
          count: 3,
          card: {
            id: 'unit-1',
            name: 'Forjador de Zaun',
            primaryDomain: 'fury',
            domains: ['fury'],
            type: 'Unit',
            energyCost: 1,
            might: 2,
            health: 1,
            marketPriceUsd: 0.45,
          },
        },
        {
          cardId: 'unit-2',
          count: 3,
          card: {
            id: 'unit-2',
            name: 'Luchador Callejero',
            primaryDomain: 'fury',
            domains: ['fury'],
            type: 'Unit',
            energyCost: 2,
            might: 3,
            health: 2,
            marketPriceUsd: 0.8,
          },
        },
      ],
      mainGear: [],
      mainSpells: [
        {
          cardId: 'spell-1',
          count: 3,
          card: {
            id: 'spell-1',
            name: 'Golpe Demoledor',
            primaryDomain: 'fury',
            domains: ['fury'],
            type: 'Spell',
            energyCost: 2,
            marketPriceUsd: 1.2,
          },
        },
      ],
      sideboard: [],
      maybeboard: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    legendName: 'Vi, Destructora de Piltover',
    legendImageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/vi.png',
    primaryDomain: 'fury',
    domains: ['fury'],
    tags: ['Competitivo', 'Aggro', 'Torneo'],
    priceUsd: 18.5,
    likesCount: 142,
    clonesCount: 89,
    tier: 'S',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    isLikedByMe: false,
  },
  {
    id: 'comm-deck-2',
    authorName: 'ShadowNinja99',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    title: 'Zed Shadow Storm (Combo OTK)',
    description: 'Usa sombras para duplicar daño de hechizos en un solo turno y rematar con Marca de la Muerte.',
    deckCode: 'RIFT1-ZED-COMBO-02',
    deckData: {
      id: 'comm-deck-2',
      name: 'Zed Shadow Storm',
      legendCard: {
        id: 'zed-01',
        name: 'Zed, Maestro de las Sombras',
        primaryDomain: 'mind',
        domains: ['mind'],
        imageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/zed.png',
        energyCost: 3,
        might: 4,
        health: 3,
      },
      domains: ['mind'],
      viewsCount: 185,
      isPublic: true,
      priceUsd: 32.0,
      runes: [{ id: 'r2', domain: 'mind', count: 12 }],
      battlefields: [],
      mainUnits: [
        {
          cardId: 'unit-3',
          count: 3,
          card: {
            id: 'unit-3',
            name: 'Asesino de la Orden de la Sombra',
            primaryDomain: 'mind',
            domains: ['mind'],
            type: 'Unit',
            energyCost: 2,
            might: 3,
            health: 2,
            marketPriceUsd: 1.5,
          },
        },
      ],
      mainGear: [],
      mainSpells: [
        {
          cardId: 'spell-2',
          count: 3,
          card: {
            id: 'spell-2',
            name: 'Sombra Viviente',
            primaryDomain: 'mind',
            domains: ['mind'],
            type: 'Spell',
            energyCost: 2,
            marketPriceUsd: 2.1,
          },
        },
      ],
      sideboard: [],
      maybeboard: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    legendName: 'Zed, Maestro de las Sombras',
    legendImageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/zed.png',
    primaryDomain: 'mind',
    domains: ['mind'],
    tags: ['Competitivo', 'Combo'],
    priceUsd: 32.0,
    likesCount: 98,
    clonesCount: 64,
    tier: 'S',
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    isLikedByMe: true,
  },
  {
    id: 'comm-deck-3',
    authorName: 'DemaciaF2P',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    title: 'Garen Guardián Starter (Económico / Budget)',
    description: '¡Menos de $10 USD! Ideal para novatos que empiezan a jugar físico sin gastar mucho.',
    deckCode: 'RIFT1-GAREN-BUDGET-03',
    deckData: {
      id: 'comm-deck-3',
      name: 'Garen Guardián Starter',
      legendCard: {
        id: 'garen-01',
        name: 'Garen, Poder de Demacia',
        primaryDomain: 'order',
        domains: ['order'],
        imageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/garen.png',
        energyCost: 4,
        might: 5,
        health: 6,
      },
      domains: ['order'],
      viewsCount: 310,
      isPublic: true,
      priceUsd: 8.5,
      runes: [{ id: 'r3', domain: 'order', count: 12 }],
      battlefields: [],
      mainUnits: [
        {
          cardId: 'unit-4',
          count: 3,
          card: {
            id: 'unit-4',
            name: 'Escudero de la Vanguardia',
            primaryDomain: 'order',
            domains: ['order'],
            type: 'Unit',
            energyCost: 1,
            might: 1,
            health: 3,
            marketPriceUsd: 0.15,
          },
        },
      ],
      mainGear: [],
      mainSpells: [],
      sideboard: [],
      maybeboard: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    legendName: 'Garen, Poder de Demacia',
    legendImageUrl: 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/garen.png',
    primaryDomain: 'order',
    domains: ['order'],
    tags: ['Budget', 'Fun', 'Novatos'],
    priceUsd: 8.5,
    likesCount: 76,
    clonesCount: 52,
    tier: 'B',
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    isLikedByMe: false,
  },
];

async function getLocalLikedIds(): Promise<Set<string>> {
  if (isServer) return new Set();
  try {
    const raw = await AsyncStorage.getItem(LIKES_CACHE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

async function saveLocalLikedIds(set: Set<string>): Promise<void> {
  if (isServer) return;
  try {
    await AsyncStorage.setItem(LIKES_CACHE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('⚠️ Error guardando likes locales:', e);
  }
}

export const CommunityDeckRepository = {
  /**
   * Obtiene la lista oficial del Meta Tier List
   */
  async getMetaTierList(): Promise<MetaTierItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('meta_tier_list')
          .select('*')
          .order('tier', { ascending: true })
          .order('winrate_percent', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: MetaTierItem[] = data.map((row: any) => ({
            id: row.id,
            archetypeName: row.archetype_name,
            tier: row.tier,
            legendName: row.legend_name,
            legendImageUrl: row.legend_image_url,
            primaryDomain: row.primary_domain,
            secondaryDomain: row.secondary_domain,
            popularityPercent: Number(row.popularity_percent) || 0,
            winratePercent: Number(row.winrate_percent) || 0,
            playstyle: row.playstyle || 'Midrange',
            keyCards: row.key_cards || [],
            description: row.description,
            sampleDeckId: row.sample_deck_id,
            updatedAt: row.updated_at,
          }));

          if (!isServer) {
            await AsyncStorage.setItem(TIER_CACHE_KEY, JSON.stringify(mapped));
          }
          return mapped;
        }
      } catch (e) {
        console.warn('⚠️ Error obteniendo Meta Tier List de Supabase:', e);
      }
    }

    // Fallback a caché local o datos semilla
    if (!isServer) {
      try {
        const cached = await AsyncStorage.getItem(TIER_CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {
        // Ignorar
      }
    }

    return SEED_META_TIERS;
  },

  /**
   * Obtiene mazos comunitarios con soporte de filtros, búsqueda y paginación
   */
  async getCommunityDecks(
    filter: CommunityDeckFilter = {}
  ): Promise<{ decks: CommunityDeck[]; total: number; hasMore: boolean }> {
    const {
      domain,
      tag,
      sortBy = 'likes',
      search = '',
      page = 0,
      limit = 10,
    } = filter;

    const likedIds = await getLocalLikedIds();

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('public_decks').select('*', { count: 'exact' });

        if (domain && domain !== 'all') {
          query = query.eq('primary_domain', domain.toLowerCase());
        }

        if (tag && tag !== 'all') {
          query = query.contains('tags', [tag]);
        }

        if (search.trim()) {
          query = query.or(`title.ilike.%${search.trim()}%,legend_name.ilike.%${search.trim()}%,author_name.ilike.%${search.trim()}%`);
        }

        // Ordenamiento
        if (sortBy === 'likes') {
          query = query.order('likes_count', { ascending: false });
        } else if (sortBy === 'recent') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'tier') {
          query = query.order('tier', { ascending: true, nullsFirst: false });
        }

        const from = page * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (!error && data) {
          const total = count || data.length;
          const mapped: CommunityDeck[] = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            authorName: row.author_name || 'Invocador',
            authorAvatar: row.author_avatar,
            title: row.title,
            description: row.description,
            deckCode: row.deck_code,
            deckData: row.deck_data,
            legendName: row.legend_name,
            legendImageUrl: row.legend_image_url,
            primaryDomain: row.primary_domain,
            domains: row.domains || [],
            tags: row.tags || [],
            priceUsd: Number(row.price_usd) || 0,
            likesCount: Number(row.likes_count) || 0,
            clonesCount: Number(row.clones_count) || 0,
            tier: row.tier,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isLikedByMe: likedIds.has(row.id),
          }));

          return {
            decks: mapped,
            total,
            hasMore: from + mapped.length < total,
          };
        }
      } catch (e) {
        console.warn('⚠️ Error consultando mazos comunitarios de Supabase:', e);
      }
    }

    // Modo Offline / Fallback a datos locales combinados con semilla
    let localDecks: CommunityDeck[] = [...SEED_COMMUNITY_DECKS];
    if (!isServer) {
      try {
        const raw = await AsyncStorage.getItem(DECKS_CACHE_KEY);
        if (raw) {
          const userPublished: CommunityDeck[] = JSON.parse(raw);
          localDecks = [...userPublished, ...SEED_COMMUNITY_DECKS];
        }
      } catch {
        // Ignorar
      }
    }

    // Aplicar filtros locales
    let filtered = localDecks.map(d => ({
      ...d,
      isLikedByMe: likedIds.has(d.id),
    }));

    if (domain && domain !== 'all') {
      filtered = filtered.filter(d => d.primaryDomain.toLowerCase() === domain.toLowerCase());
    }

    if (tag && tag !== 'all') {
      filtered = filtered.filter(d => d.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        d =>
          d.title.toLowerCase().includes(q) ||
          (d.legendName && d.legendName.toLowerCase().includes(q)) ||
          d.authorName.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'likes') {
      filtered.sort((a, b) => b.likesCount - a.likesCount);
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'tier') {
      const tierOrder: Record<string, number> = { S: 1, A: 2, B: 3, C: 4 };
      filtered.sort((a, b) => (tierOrder[a.tier || 'C'] || 5) - (tierOrder[b.tier || 'C'] || 5));
    }

    const start = page * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      decks: paginated,
      total: filtered.length,
      hasMore: start + paginated.length < filtered.length,
    };
  },

  /**
   * Publica un mazo propio al Hub Comunitario
   */
  async publishDeck(input: PublishDeckInput): Promise<CommunityDeck> {
    const { deck, title, description, tags = ['Comunidad'], authorName } = input;
    const deckCode = exportDeckToCode(deck);
    const primaryDomain = deck.domains?.[0] || 'order';
    const now = new Date().toISOString();

    const newCommunityDeck: CommunityDeck = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: (title || deck.name).trim(),
      description: description || deck.description || '',
      authorName: authorName || 'Invocador de la Grieta',
      deckCode,
      deckData: deck,
      legendName: deck.legendCard?.name || 'Sin Leyenda',
      legendImageUrl: deck.legendCard?.imageUrl || deck.coverImage,
      primaryDomain,
      domains: deck.domains || [primaryDomain],
      tags,
      priceUsd: Number(deck.priceUsd) || 0,
      likesCount: 1,
      clonesCount: 0,
      tier: 'A',
      createdAt: now,
      updatedAt: now,
      isLikedByMe: true,
    };

    if (isSupabaseConfigured()) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const payload: Record<string, any> = {
          title: newCommunityDeck.title,
          description: newCommunityDeck.description,
          author_name: session?.user?.user_metadata?.username || authorName || 'Invocador',
          deck_code: deckCode,
          deck_data: deck,
          legend_name: newCommunityDeck.legendName,
          legend_image_url: newCommunityDeck.legendImageUrl,
          primary_domain: primaryDomain,
          domains: deck.domains || [primaryDomain],
          tags,
          price_usd: newCommunityDeck.priceUsd,
          tier: 'A',
          created_at: now,
          updated_at: now,
        };

        if (session?.user) {
          payload.user_id = session.user.id;
        }

        const { data, error } = await supabase
          .from('public_decks')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          newCommunityDeck.id = data.id;
          newCommunityDeck.userId = data.user_id;
        }
      } catch (e) {
        console.warn('⚠️ Supabase publishDeck falló, guardando localmente:', e);
      }
    }

    // Guardar en caché local
    if (!isServer) {
      try {
        const raw = await AsyncStorage.getItem(DECKS_CACHE_KEY);
        const list: CommunityDeck[] = raw ? JSON.parse(raw) : [];
        list.unshift(newCommunityDeck);
        await AsyncStorage.setItem(DECKS_CACHE_KEY, JSON.stringify(list));

        // Marcar como likeado por mí
        const likedIds = await getLocalLikedIds();
        likedIds.add(newCommunityDeck.id);
        await saveLocalLikedIds(likedIds);
      } catch (e) {
        console.warn('⚠️ Error guardando mazo publicado en caché local:', e);
      }
    }

    return newCommunityDeck;
  },

  /**
   * Alterna el voto/like de un mazo
   */
  async toggleLike(deckId: string): Promise<{ liked: boolean; newCount: number }> {
    const likedIds = await getLocalLikedIds();
    const wasLiked = likedIds.has(deckId);
    const willBeLiked = !wasLiked;

    if (willBeLiked) {
      likedIds.add(deckId);
    } else {
      likedIds.delete(deckId);
    }
    await saveLocalLikedIds(likedIds);

    let newCount = 0;

    if (isSupabaseConfigured()) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          if (willBeLiked) {
            await supabase.from('deck_likes').insert([
              {
                deck_id: deckId,
                user_id: session.user.id,
              },
            ]);
          } else {
            await supabase
              .from('deck_likes')
              .delete()
              .eq('deck_id', deckId)
              .eq('user_id', session.user.id);
          }
        }
      } catch (e) {
        console.warn('⚠️ Error toggleando like en Supabase:', e);
      }
    }

    return { liked: willBeLiked, newCount };
  },

  /**
   * Incrementa el contador de clones al importar un mazo
   */
  async incrementCloneCount(deckId: string): Promise<number> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.rpc('increment_deck_clones', { target_deck_id: deckId });
      } catch {
        // Ignorar si el RPC no existe
      }
    }
    return 1;
  },
};
