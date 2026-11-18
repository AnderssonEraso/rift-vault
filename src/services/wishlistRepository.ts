import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { WishlistItem, WishlistPriority } from '@/types/wishlist';
import { RiftCard } from '@/types/card';

const STORAGE_KEY = '@riftdex_wishlist_cache';

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

async function getLocalWishlist(): Promise<WishlistItem[]> {
  if (isServer) return [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('⚠️ Error leyendo wishlist local:', e);
    return [];
  }
}

async function saveLocalWishlist(items: WishlistItem[]): Promise<void> {
  if (isServer) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('⚠️ Error guardando wishlist local:', e);
  }
}

export const WishlistRepository = {
  /**
   * Obtiene todos los elementos de la lista de deseados (Supabase con fallback a AsyncStorage)
   */
  async getWishlist(): Promise<WishlistItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('wishlists')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: WishlistItem[] = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            cardId: row.card_id,
            card: row.card_data,
            targetQuantity: row.target_quantity || 1,
            isFoil: row.is_foil || false,
            priority: (row.priority as WishlistPriority) || 'media',
            targetPrice: row.target_price !== null && row.target_price !== undefined ? Number(row.target_price) : null,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));

          // Actualizar caché local
          await saveLocalWishlist(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('⚠️ Supabase getWishlist falló, cargando desde local:', e);
      }
    }

    // Modo invitado u offline
    return getLocalWishlist();
  },

  /**
   * Añade o actualiza una carta en la lista de deseados
   */
  async addOrUpdateItem(params: {
    card: RiftCard;
    targetQuantity?: number;
    isFoil?: boolean;
    priority?: WishlistPriority;
    targetPrice?: number | null;
  }): Promise<WishlistItem> {
    const {
      card,
      targetQuantity = 1,
      isFoil = false,
      priority = 'media',
      targetPrice = null,
    } = params;

    const localList = await getLocalWishlist();
    const existingIndex = localList.findIndex(
      item => item.cardId === card.id && item.isFoil === isFoil
    );

    const now = new Date().toISOString();
    let itemToSave: WishlistItem;

    if (existingIndex >= 0) {
      itemToSave = {
        ...localList[existingIndex],
        card,
        targetQuantity,
        isFoil,
        priority,
        targetPrice,
        updatedAt: now,
      };
    } else {
      itemToSave = {
        id: `wish-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        cardId: card.id,
        card,
        targetQuantity,
        isFoil,
        priority,
        targetPrice,
        createdAt: now,
        updatedAt: now,
      };
    }

    // Intentar sincronizar con Supabase si está autenticado y configurado
    if (isSupabaseConfigured()) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const payload = {
            user_id: session.user.id,
            card_id: card.id,
            card_data: card,
            target_quantity: targetQuantity,
            is_foil: isFoil,
            priority,
            target_price: targetPrice,
            updated_at: now,
          };

          const { data, error } = await supabase
            .from('wishlists')
            .upsert(payload, { onConflict: 'user_id,card_id,is_foil' })
            .select()
            .single();

          if (!error && data) {
            itemToSave.id = data.id;
            itemToSave.userId = data.user_id;
          }
        }
      } catch (e) {
        console.warn('⚠️ Supabase addOrUpdateItem falló, guardando localmente:', e);
      }
    }

    // Actualizar almacenamiento local
    if (existingIndex >= 0) {
      localList[existingIndex] = itemToSave;
    } else {
      localList.unshift(itemToSave);
    }
    await saveLocalWishlist(localList);

    return itemToSave;
  },

  /**
   * Actualiza propiedades específicas de un elemento de la Wishlist
   */
  async updateItem(
    id: string,
    updates: Partial<Omit<WishlistItem, 'id' | 'cardId' | 'createdAt'>>
  ): Promise<WishlistItem | null> {
    const localList = await getLocalWishlist();
    const idx = localList.findIndex(item => item.id === id);
    if (idx === -1) return null;

    const updatedItem: WishlistItem = {
      ...localList[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const dbUpdates: Record<string, any> = {
          updated_at: updatedItem.updatedAt,
        };
        if (updates.targetQuantity !== undefined) dbUpdates.target_quantity = updates.targetQuantity;
        if (updates.isFoil !== undefined) dbUpdates.is_foil = updates.isFoil;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.targetPrice !== undefined) dbUpdates.target_price = updates.targetPrice;

        await supabase.from('wishlists').update(dbUpdates).eq('id', id);
      } catch (e) {
        console.warn('⚠️ Supabase updateItem falló:', e);
      }
    }

    localList[idx] = updatedItem;
    await saveLocalWishlist(localList);
    return updatedItem;
  },

  /**
   * Elimina un elemento de la Wishlist por su ID único
   */
  async removeItem(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('wishlists').delete().eq('id', id);
      } catch (e) {
        console.warn('⚠️ Supabase removeItem falló:', e);
      }
    }

    const localList = await getLocalWishlist();
    const filtered = localList.filter(item => item.id !== id);
    await saveLocalWishlist(filtered);
    return true;
  },

  /**
   * Elimina un elemento de la Wishlist por su ID de carta
   */
  async removeByCardId(cardId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('wishlists').delete().eq('card_id', cardId);
      } catch (e) {
        console.warn('⚠️ Supabase removeByCardId falló:', e);
      }
    }

    const localList = await getLocalWishlist();
    const filtered = localList.filter(item => item.cardId !== cardId);
    await saveLocalWishlist(filtered);
    return true;
  },

  /**
   * Limpia toda la Wishlist
   */
  async clearWishlist(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from('wishlists').delete().eq('user_id', session.user.id);
        }
      } catch (e) {
        console.warn('⚠️ Supabase clearWishlist falló:', e);
      }
    }

    await saveLocalWishlist([]);
  },
};
