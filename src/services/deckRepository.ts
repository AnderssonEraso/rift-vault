import { Deck, DeckCardSlot } from '@/types/deck';
import { RiftCard } from '@/types/card';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@riftdex_decks_cache';

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getLocalDecks(): Promise<Deck[]> {
  if (isServer) return [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveLocalDecks(decks: Deck[]): Promise<void> {
  if (isServer) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch (e) {
    console.warn('⚠️ Error guardando mazos localmente:', e);
  }
}

/**
 * Sincroniza todas las cartas de un mazo con la tabla relacional `deck_cards`.
 * Almacena la llave foránea `deck_id`, la categoría, la información de la carta y el boolean `is_owned`.
 */
async function syncDeckCardsToSupabase(deckId: string, deck: Deck): Promise<void> {
  if (!isSupabaseConfigured() || !deckId) return;

  try {
    const rowsToInsert: any[] = [];

    // 1. Carta de Leyenda
    if (deck.legendCard) {
      rowsToInsert.push({
        deck_id: deckId,
        card_id: deck.legendCard.id,
        category: 'legend',
        count: 1,
        card_data: deck.legendCard,
        is_owned: true,
      });
    }

    // 1.5. Carta Unidad Campeón (Champ Unit)
    if (deck.championUnit) {
      rowsToInsert.push({
        deck_id: deckId,
        card_id: deck.championUnit.id,
        category: 'champion_unit',
        count: 1,
        card_data: deck.championUnit,
        is_owned: true,
      });
    }

    // 2. Campos de Batalla (Battlefields)
    for (const slot of deck.battlefields || []) {
      if (slot.card) {
        rowsToInsert.push({
          deck_id: deckId,
          card_id: slot.cardId || slot.card.id,
          category: 'battlefield',
          count: slot.count || 1,
          card_data: slot.card,
          is_owned: slot.isOwned ?? false,
        });
      }
    }

    // 3. Unidades del Mazo Principal
    for (const slot of deck.mainUnits || []) {
      if (slot.card) {
        rowsToInsert.push({
          deck_id: deckId,
          card_id: slot.cardId || slot.card.id,
          category: 'unit',
          count: slot.count || 1,
          card_data: slot.card,
          is_owned: slot.isOwned ?? false,
        });
      }
    }

    // 4. Equipos (Gear) del Mazo Principal
    for (const slot of deck.mainGear || []) {
      if (slot.card) {
        rowsToInsert.push({
          deck_id: deckId,
          card_id: slot.cardId || slot.card.id,
          category: 'gear',
          count: slot.count || 1,
          card_data: slot.card,
          is_owned: slot.isOwned ?? false,
        });
      }
    }

    // 5. Hechizos (Spells) del Mazo Principal
    for (const slot of deck.mainSpells || []) {
      if (slot.card) {
        rowsToInsert.push({
          deck_id: deckId,
          card_id: slot.cardId || slot.card.id,
          category: 'spell',
          count: slot.count || 1,
          card_data: slot.card,
          is_owned: slot.isOwned ?? false,
        });
      }
    }

    // 6. Banquillo (Sideboard)
    for (const slot of deck.sideboard || []) {
      if (slot.card) {
        rowsToInsert.push({
          deck_id: deckId,
          card_id: slot.cardId || slot.card.id,
          category: 'sideboard',
          count: slot.count || 1,
          card_data: slot.card,
          is_owned: slot.isOwned ?? false,
        });
      }
    }

    // 7. En consideración (Maybeboard)
    for (const slot of deck.maybeboard || []) {
      if (slot.card) {
        rowsToInsert.push({
          deck_id: deckId,
          card_id: slot.cardId || slot.card.id,
          category: 'maybeboard',
          count: slot.count || 1,
          card_data: slot.card,
          is_owned: slot.isOwned ?? false,
        });
      }
    }

    // Limpiar cartas previas y persistir el snapshot actual en la tabla relacional
    await supabase.from('deck_cards').delete().eq('deck_id', deckId);

    if (rowsToInsert.length > 0) {
      const { error } = await supabase.from('deck_cards').insert(rowsToInsert);
      if (error) {
        console.warn('⚠️ Error insertando en deck_cards:', error.message);
      }
    }
  } catch (err) {
    console.warn('⚠️ Error al sincronizar cartas con tabla deck_cards:', err);
  }
}

export const DeckRepository = {
  async getDecks(): Promise<Deck[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: decksData, error } = await supabase
          .from('decks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && decksData && decksData.length > 0) {
          const deckIds = decksData.map((d: any) => d.id);

          // Consultar todas las cartas pertenecientes a estos mazos desde deck_cards
          const { data: allDeckCards } = await supabase
            .from('deck_cards')
            .select('*')
            .in('deck_id', deckIds);

          const mapped: Deck[] = decksData.map((row: any) => {
            const cardsForDeck = allDeckCards ? allDeckCards.filter((c: any) => c.deck_id === row.id) : [];

            // Mapeador auxiliar por categoría con el flag is_owned
            const mapCategoryToSlots = (cat: string, fallbackList: any[] = []): DeckCardSlot[] => {
              const matching = cardsForDeck.filter((c: any) => c.category === cat);
              if (matching.length > 0) {
                return matching.map((r: any) => ({
                  cardId: r.card_id,
                  card: r.card_data,
                  count: r.count,
                  isOwned: r.is_owned ?? false,
                }));
              }
              return fallbackList;
            };

            // Leyenda: preferir de deck_cards o de la columna legend_card
            let legendCard = row.legend_card;
            const legendRow = cardsForDeck.find((c: any) => c.category === 'legend');
            if (legendRow && legendRow.card_data && Object.keys(legendRow.card_data).length > 0) {
              legendCard = legendRow.card_data;
            }

            // Unidad Campeón (Champ Unit): preferir de deck_cards o row
            let championUnit = row.champion_unit;
            const champRow = cardsForDeck.find((c: any) => c.category === 'champion_unit');
            if (champRow && champRow.card_data && Object.keys(champRow.card_data).length > 0) {
              championUnit = champRow.card_data;
            }

            return {
              id: row.id,
              name: row.name,
              description: row.description || '',
              coverImage: row.cover_image,
              legendCard,
              championUnit,
              domains: row.domains || [],
              viewsCount: row.views_count || 0,
              isPublic: row.is_public || false,
              priceUsd: Number(row.price_usd) || 0,
              color: row.color || '#3B82F6',
              icon: row.icon || 'sparkles',
              runes: row.runes || [],
              battlefields: mapCategoryToSlots('battlefield', row.battlefields || []),
              mainUnits: mapCategoryToSlots('unit', row.main_units || []),
              mainGear: mapCategoryToSlots('gear', row.main_gear || []),
              mainSpells: mapCategoryToSlots('spell', row.main_spells || []),
              sideboard: mapCategoryToSlots('sideboard', row.sideboard || []),
              maybeboard: mapCategoryToSlots('maybeboard', row.maybeboard || []),
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            };
          });

          await saveLocalDecks(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('⚠️ Supabase getDecks falló:', e);
      }
    }
    // Fallback a almacenamiento local persistente
    return await getLocalDecks();
  },

  async createDeck(data: {
    name: string;
    description?: string;
    legendCard?: RiftCard;
    domains?: string[];
    color?: string;
    icon?: string;
  }): Promise<Deck> {
    const generatedId = generateUUID();

    const newDeck: Deck = {
      id: generatedId,
      name: data.name,
      description: data.description || '',
      coverImage: data.legendCard?.thumbnailUrl || data.legendCard?.imageUrl,
      legendCard: data.legendCard,
      domains: data.domains || ['fury'],
      viewsCount: 0,
      isPublic: false,
      priceUsd: 0,
      color: data.color || '#3B82F6',
      icon: data.icon || 'sparkles',
      runes: [
        { id: `r1_${Date.now()}`, domain: data.domains?.[0] || 'fury', count: 6, iconName: 'flame' },
        { id: `r2_${Date.now()}`, domain: data.domains?.[1] || 'calm', count: 6, iconName: 'water' },
      ],
      battlefields: [],
      mainUnits: [],
      mainGear: [],
      mainSpells: [],
      sideboard: [],
      maybeboard: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        const { data: created, error } = await supabase
          .from('decks')
          .insert([
            {
              id: generatedId,
              user_id: userId,
              name: newDeck.name,
              description: newDeck.description,
              cover_image: newDeck.coverImage || null,
              legend_card: newDeck.legendCard || null,
              domains: newDeck.domains,
              views_count: 0,
              is_public: false,
              price_usd: 0,
              color: newDeck.color,
              icon: newDeck.icon,
              runes: newDeck.runes,
              battlefields: newDeck.battlefields,
              main_units: newDeck.mainUnits,
              main_gear: newDeck.mainGear,
              main_spells: newDeck.mainSpells,
              sideboard: newDeck.sideboard,
              maybeboard: newDeck.maybeboard,
            },
          ])
          .select()
          .single();

        if (error) {
          console.warn('⚠️ Supabase createDeck error:', error.message);
        } else if (created) {
          newDeck.id = created.id;

          // Si hay una carta de leyenda seleccionada, sincronizarla de inmediato en deck_cards
          if (newDeck.legendCard) {
            await syncDeckCardsToSupabase(created.id, newDeck);
          }
        }
      } catch (e) {
        console.warn('⚠️ Supabase createDeck error no controlado:', e);
      }
    }

    const currentLocal = await getLocalDecks();
    await saveLocalDecks([newDeck, ...currentLocal.filter(d => d.id !== newDeck.id)]);

    return newDeck;
  },

  async updateDeck(deckId: string, updates: Partial<Deck>): Promise<Deck> {
    const updatedAt = new Date().toISOString();

    const currentLocal = await getLocalDecks();
    const existing = currentLocal.find(d => d.id === deckId);
    const mergedDeck: Deck = {
      ...(existing || ({} as Deck)),
      ...updates,
      id: deckId,
      updatedAt,
    };

    if (isSupabaseConfigured()) {
      try {
        const dbUpdates: any = { updated_at: updatedAt };
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.domains !== undefined) dbUpdates.domains = updates.domains;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
        if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage;
        if (updates.legendCard !== undefined) dbUpdates.legend_card = updates.legendCard;
        if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
        if (updates.priceUsd !== undefined) dbUpdates.price_usd = updates.priceUsd;
        if (updates.runes !== undefined) dbUpdates.runes = updates.runes;
        if (updates.battlefields !== undefined) dbUpdates.battlefields = updates.battlefields;
        if (updates.mainUnits !== undefined) dbUpdates.main_units = updates.mainUnits;
        if (updates.mainGear !== undefined) dbUpdates.main_gear = updates.mainGear;
        if (updates.mainSpells !== undefined) dbUpdates.main_spells = updates.mainSpells;
        if (updates.sideboard !== undefined) dbUpdates.sideboard = updates.sideboard;
        if (updates.maybeboard !== undefined) dbUpdates.maybeboard = updates.maybeboard;

        const { error } = await supabase.from('decks').update(dbUpdates).eq('id', deckId);
        if (error) {
          console.warn('⚠️ Supabase updateDeck error:', error.message);
        }

        // Sincronizar las cartas con la tabla relacional deck_cards si alguna sección cambió
        const hasCardsUpdate =
          updates.mainUnits !== undefined ||
          updates.mainGear !== undefined ||
          updates.mainSpells !== undefined ||
          updates.battlefields !== undefined ||
          updates.legendCard !== undefined ||
          updates.sideboard !== undefined ||
          updates.maybeboard !== undefined;

        if (hasCardsUpdate) {
          await syncDeckCardsToSupabase(deckId, mergedDeck);
        }
      } catch (e) {
        console.warn('⚠️ Supabase updateDeck error no controlado:', e);
      }
    }

    const updatedLocal = currentLocal.map(d => (d.id === deckId ? mergedDeck : d));
    await saveLocalDecks(updatedLocal);

    return mergedDeck;
  },

  async deleteDeck(deckId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('decks').delete().eq('id', deckId);
        // Gracias a ON DELETE CASCADE en Postgres, deck_cards se eliminan automáticamente
      } catch (e) {
        console.warn('⚠️ Supabase deleteDeck error:', e);
      }
    }

    const currentLocal = await getLocalDecks();
    await saveLocalDecks(currentLocal.filter(d => d.id !== deckId));

    return true;
  },
};
