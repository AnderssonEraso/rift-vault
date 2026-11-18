import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { WishlistItem, WishlistPriority, WishlistStats } from '@/types/wishlist';
import { RiftCard } from '@/types/card';
import { WishlistRepository } from '@/services/wishlistRepository';
import { useCollection } from '@/context/CollectionContext';
import { MissingCardDetail } from '@/utils/deckCollectionAnalysis';

interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  stats: WishlistStats;

  // Acciones sobre la Wishlist
  addToWishlist: (params: {
    card: RiftCard;
    targetQuantity?: number;
    isFoil?: boolean;
    priority?: WishlistPriority;
    targetPrice?: number | null;
  }) => Promise<void>;
  removeFromWishlist: (cardId: string) => Promise<void>;
  updateWishlistItem: (
    id: string,
    updates: Partial<Omit<WishlistItem, 'id' | 'cardId' | 'createdAt'>>
  ) => Promise<void>;
  isInWishlist: (cardId: string) => boolean;
  getWishlistItem: (cardId: string) => WishlistItem | undefined;

  // Mover directamente a la colección física ("¡Ya la conseguí!")
  moveToCollection: (cardId: string, folderId?: string) => Promise<boolean>;

  // Añadir múltiples cartas faltantes de un mazo
  addMissingCardsToWishlist: (
    missingCards: MissingCardDetail[],
    priority?: WishlistPriority
  ) => Promise<number>;

  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { quickAddCard } = useCollection();

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await WishlistRepository.getWishlist();
      setItems(data);
    } catch (e) {
      console.warn('⚠️ Error al cargar wishlist:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const isInWishlist = useCallback(
    (cardId: string): boolean => {
      return items.some(item => item.cardId === cardId);
    },
    [items]
  );

  const getWishlistItem = useCallback(
    (cardId: string): WishlistItem | undefined => {
      return items.find(item => item.cardId === cardId);
    },
    [items]
  );

  const addToWishlist = useCallback(
    async (params: {
      card: RiftCard;
      targetQuantity?: number;
      isFoil?: boolean;
      priority?: WishlistPriority;
      targetPrice?: number | null;
    }) => {
      const savedItem = await WishlistRepository.addOrUpdateItem(params);
      setItems(prev => {
        const idx = prev.findIndex(
          i => i.cardId === savedItem.cardId && i.isFoil === savedItem.isFoil
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = savedItem;
          return next;
        }
        return [savedItem, ...prev];
      });
    },
    []
  );

  const removeFromWishlist = useCallback(async (cardId: string) => {
    await WishlistRepository.removeByCardId(cardId);
    setItems(prev => prev.filter(item => item.cardId !== cardId));
  }, []);

  const updateWishlistItem = useCallback(
    async (
      id: string,
      updates: Partial<Omit<WishlistItem, 'id' | 'cardId' | 'createdAt'>>
    ) => {
      const updated = await WishlistRepository.updateItem(id, updates);
      if (updated) {
        setItems(prev => prev.map(item => (item.id === id ? updated : item)));
      }
    },
    []
  );

  const moveToCollection = useCallback(
    async (cardId: string, folderId?: string): Promise<boolean> => {
      const item = items.find(i => i.cardId === cardId);
      if (!item) return false;

      // 1. Agregar a la colección física
      const qty = item.targetQuantity || 1;
      for (let i = 0; i < qty; i++) {
        await quickAddCard(item.card, item.isFoil, folderId);
      }

      // 2. Eliminar de la wishlist
      await WishlistRepository.removeByCardId(cardId);
      setItems(prev => prev.filter(i => i.cardId !== cardId));

      return true;
    },
    [items, quickAddCard]
  );

  const addMissingCardsToWishlist = useCallback(
    async (
      missingCards: MissingCardDetail[],
      priority: WishlistPriority = 'alta'
    ): Promise<number> => {
      let addedCount = 0;
      for (const mc of missingCards) {
        // Armar objeto RiftCard básico a partir de MissingCardDetail
        const cardObj: RiftCard = {
          id: mc.cardId,
          name: mc.name,
          imageUrl: mc.imageUrl,
          domains: ['order'],
          primaryDomain: 'order',
          marketPriceUsd: mc.estimatedPriceUsd,
          prices: { usd: mc.estimatedPriceUsd },
        };

        await WishlistRepository.addOrUpdateItem({
          card: cardObj,
          targetQuantity: mc.missing,
          priority,
          targetPrice: mc.estimatedPriceUsd ? Number((mc.estimatedPriceUsd * 0.9).toFixed(2)) : null,
        });
        addedCount++;
      }

      // Recargar lista completa consolidada
      const reloaded = await WishlistRepository.getWishlist();
      setItems(reloaded);
      return addedCount;
    },
    []
  );

  // Estadísticas calculadas en tiempo real
  const stats = useMemo<WishlistStats>(() => {
    let totalCardsCount = 0;
    let estimatedTotalUsd = 0;
    let dealsCount = 0;

    for (const item of items) {
      const qty = item.targetQuantity || 1;
      totalCardsCount += qty;

      const currentPrice =
        item.card?.marketPriceUsd ||
        item.card?.prices?.usd ||
        item.card?.prices?.market ||
        0;

      estimatedTotalUsd += qty * currentPrice;

      if (
        item.targetPrice !== null &&
        item.targetPrice !== undefined &&
        item.targetPrice > 0 &&
        currentPrice > 0 &&
        currentPrice <= item.targetPrice
      ) {
        dealsCount++;
      }
    }

    return {
      totalItems: items.length,
      totalCardsCount,
      estimatedTotalUsd,
      dealsCount,
    };
  }, [items]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        isLoading,
        stats,
        addToWishlist,
        removeFromWishlist,
        updateWishlistItem,
        isInWishlist,
        getWishlistItem,
        moveToCollection,
        addMissingCardsToWishlist,
        refreshWishlist: loadItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist debe utilizarse dentro de un WishlistProvider');
  }
  return context;
};
