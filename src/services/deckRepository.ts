import { Deck } from '@/types/deck';
import { RiftCard } from '@/types/card';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@riftdex_decks_cache';

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

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

export const DeckRepository = {
  async getDecks(): Promise<Deck[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('decks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Deck[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            coverImage: row.cover_image,
            legendCard: row.legend_card,
            domains: row.domains || [],
            viewsCount: row.views_count || 0,
            isPublic: row.is_public || false,
            priceUsd: Number(row.price_usd) || 0,
            color: row.color || '#3B82F6',
            icon: row.icon || 'sparkles',
            runes: row.runes || [],
            battlefields: row.battlefields || [],
            mainUnits: row.main_units || [],
            mainGear: row.main_gear || [],
            mainSpells: row.main_spells || [],
            sideboard: row.sideboard || [],
            maybeboard: row.maybeboard || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
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
    const newDeck: Deck = {
      id: `deck_${Date.now()}`,
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
        { id: 'r1', domain: data.domains?.[0] || 'fury', count: 6, iconName: 'flame' },
        { id: 'r2', domain: data.domains?.[1] || 'calm', count: 6, iconName: 'water' },
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
        const { data: created, error } = await supabase
          .from('decks')
          .insert([
            {
              name: newDeck.name,
              description: newDeck.description,
              cover_image: newDeck.coverImage,
              legend_card: newDeck.legendCard,
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

        if (!error && created) {
          newDeck.id = created.id;
        }
      } catch (e) {
        console.warn('⚠️ Supabase createDeck error:', e);
      }
    }

    const currentLocal = await getLocalDecks();
    await saveLocalDecks([newDeck, ...currentLocal.filter(d => d.id !== newDeck.id)]);

    return newDeck;
  },

  async updateDeck(deckId: string, updates: Partial<Deck>): Promise<Deck> {
    const updatedAt = new Date().toISOString();
    const payload: any = { ...updates, updatedAt };

    if (isSupabaseConfigured()) {
      try {
        const dbUpdates: any = { ...updates, updated_at: updatedAt };
        if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage;
        if (updates.legendCard !== undefined) dbUpdates.legend_card = updates.legendCard;
        if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
        if (updates.priceUsd !== undefined) dbUpdates.price_usd = updates.priceUsd;
        if (updates.mainUnits !== undefined) dbUpdates.main_units = updates.mainUnits;
        if (updates.mainGear !== undefined) dbUpdates.main_gear = updates.mainGear;
        if (updates.mainSpells !== undefined) dbUpdates.main_spells = updates.mainSpells;

        delete dbUpdates.coverImage;
        delete dbUpdates.legendCard;
        delete dbUpdates.isPublic;
        delete dbUpdates.priceUsd;
        delete dbUpdates.mainUnits;
        delete dbUpdates.mainGear;
        delete dbUpdates.mainSpells;
        delete dbUpdates.updatedAt;

        await supabase.from('decks').update(dbUpdates).eq('id', deckId);
      } catch (e) {
        console.warn('⚠️ Supabase updateDeck error:', e);
      }
    }

    const currentLocal = await getLocalDecks();
    const updatedLocal = currentLocal.map(d => (d.id === deckId ? { ...d, ...updates, updatedAt } : d));
    await saveLocalDecks(updatedLocal);

    return { id: deckId, ...updates } as Deck;
  },

  async deleteDeck(deckId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('decks').delete().eq('id', deckId);
      } catch (e) {
        console.warn('⚠️ Supabase deleteDeck error:', e);
      }
    }

    const currentLocal = await getLocalDecks();
    await saveLocalDecks(currentLocal.filter(d => d.id !== deckId));

    return true;
  },
};
