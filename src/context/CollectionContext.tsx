import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { RiftCard } from '@/types/card';
import {
  CardOwnershipSummary,
  CollectionFolder,
  FolderCardItem,
  FolderStats,
} from '@/types/collection';
import {
  collectionRepository,
  DEFAULT_ALL_FOLDER_ID,
} from '@/services/collectionRepository';

interface CollectionContextType {
  folders: CollectionFolder[];
  activeFolderId: string;
  activeFolder: CollectionFolder | undefined;
  setActiveFolderId: (folderId: string) => void;
  createFolder: (name: string, icon?: string, color?: string, description?: string) => Promise<CollectionFolder>;
  deleteFolder: (folderId: string) => Promise<void>;
  
  // Cartas de la carpeta actualmente abierta
  currentFolderItems: FolderCardItem[];
  // Todas las cartas del inventario consolidado
  allCollectionItems: FolderCardItem[];
  
  // Consulta de propiedad de una carta
  getCardOwnership: (cardId: string) => CardOwnershipSummary;
  // Consulta de copias en una carpeta específica
  getFolderCardCounts: (folderId: string, cardId: string) => { regular: number; foil: number; total: number };
  
  // Modificar copias
  setCardCopiesInFolder: (
    card: RiftCard,
    folderId: string,
    regularCount: number,
    foilCount: number
  ) => Promise<void>;
  
  // Agregar rápido a la carpeta activa o general
  quickAddCard: (card: RiftCard, isFoil?: boolean, folderId?: string) => Promise<void>;
  quickRemoveCard: (cardId: string, isFoil?: boolean, folderId?: string) => Promise<void>;

  stats: FolderStats;
  reloadCollection: () => Promise<void>;
}

const CollectionContext = createContext<CollectionContextType>({
  folders: [],
  activeFolderId: DEFAULT_ALL_FOLDER_ID,
  activeFolder: undefined,
  setActiveFolderId: () => {},
  createFolder: async () => ({} as CollectionFolder),
  deleteFolder: async () => {},
  currentFolderItems: [],
  allCollectionItems: [],
  getCardOwnership: () => ({
    cardId: '',
    totalRegular: 0,
    totalFoil: 0,
    totalCopies: 0,
    folderIds: [],
  }),
  getFolderCardCounts: () => ({ regular: 0, foil: 0, total: 0 }),
  setCardCopiesInFolder: async () => {},
  quickAddCard: async () => {},
  quickRemoveCard: async () => {},
  stats: {
    uniqueCards: 0,
    totalCopies: 0,
    totalRegular: 0,
    totalFoil: 0,
    estimatedValueUsd: 0,
  },
  reloadCollection: async () => {},
});

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>(DEFAULT_ALL_FOLDER_ID);
  const [currentFolderItems, setCurrentFolderItems] = useState<FolderCardItem[]>([]);
  const [allCollectionItems, setAllCollectionItems] = useState<FolderCardItem[]>([]);
  const [rawFolderItemsMap, setRawFolderItemsMap] = useState<Record<string, FolderCardItem[]>>({});

  const reloadCollection = useCallback(async () => {
    try {
      const fetchedFolders = await collectionRepository.getFolders();
      setFolders(fetchedFolders);

      // Cargar items de cada carpeta
      const itemsMap: Record<string, FolderCardItem[]> = {};
      for (const folder of fetchedFolders) {
        if (folder.id !== DEFAULT_ALL_FOLDER_ID) {
          itemsMap[folder.id] = await collectionRepository.getFolderItems(folder.id);
        }
      }
      setRawFolderItemsMap(itemsMap);

      const all = await collectionRepository.getAllItems();
      setAllCollectionItems(all);

      if (activeFolderId === DEFAULT_ALL_FOLDER_ID) {
        setCurrentFolderItems(all);
      } else {
        const folderItems = await collectionRepository.getFolderItems(activeFolderId);
        setCurrentFolderItems(folderItems);
      }
    } catch (err) {
      console.warn('Error recargando colección:', err);
    }
  }, [activeFolderId]);

  useEffect(() => {
    reloadCollection();
  }, [reloadCollection]);

  // Carpeta activa
  const activeFolder = useMemo(() => {
    return folders.find(f => f.id === activeFolderId) || folders[0];
  }, [folders, activeFolderId]);

  // Crear nueva carpeta personalizada
  const createFolder = async (
    name: string,
    icon = '📁',
    color = '#C8AA6E',
    description = ''
  ): Promise<CollectionFolder> => {
    const created = await collectionRepository.createFolder(name, icon, color, description);
    await reloadCollection();
    setActiveFolderId(created.id);
    return created;
  };

  // Eliminar carpeta
  const deleteFolder = async (folderId: string) => {
    if (folderId === DEFAULT_ALL_FOLDER_ID) return;
    await collectionRepository.deleteFolder(folderId);
    if (activeFolderId === folderId) {
      setActiveFolderId(DEFAULT_ALL_FOLDER_ID);
    }
    await reloadCollection();
  };

  // Resumen de cuántas copias tiene en total y en qué carpetas
  const getCardOwnership = useCallback(
    (cardId: string): CardOwnershipSummary => {
      let totalRegular = 0;
      let totalFoil = 0;
      const folderIds: string[] = [];

      for (const [fId, items] of Object.entries(rawFolderItemsMap)) {
        const found = items.find(i => i.cardId === cardId);
        if (found && (found.regularCount > 0 || found.foilCount > 0)) {
          totalRegular += found.regularCount;
          totalFoil += found.foilCount;
          folderIds.push(fId);
        }
      }

      return {
        cardId,
        totalRegular,
        totalFoil,
        totalCopies: totalRegular + totalFoil,
        folderIds,
      };
    },
    [rawFolderItemsMap]
  );

  // Copias en una carpeta particular
  const getFolderCardCounts = useCallback(
    (folderId: string, cardId: string) => {
      if (folderId === DEFAULT_ALL_FOLDER_ID) {
        const summary = getCardOwnership(cardId);
        return {
          regular: summary.totalRegular,
          foil: summary.totalFoil,
          total: summary.totalCopies,
        };
      }

      const items = rawFolderItemsMap[folderId] || [];
      const item = items.find(i => i.cardId === cardId);
      if (!item) return { regular: 0, foil: 0, total: 0 };
      return {
        regular: item.regularCount,
        foil: item.foilCount,
        total: item.regularCount + item.foilCount,
      };
    },
    [rawFolderItemsMap, getCardOwnership]
  );

  // Asignar copias exactas en una carpeta
  const setCardCopiesInFolder = async (
    card: RiftCard,
    folderId: string,
    regularCount: number,
    foilCount: number
  ) => {
    const targetFolderId =
      folderId === DEFAULT_ALL_FOLDER_ID
        ? folders.find(f => !f.isDefault)?.id || 'folder-favorites'
        : folderId;

    await collectionRepository.updateCardCopies(targetFolderId, card, regularCount, foilCount);
    await reloadCollection();
  };

  // Agregar rápido
  const quickAddCard = async (
    card: RiftCard,
    isFoil = false,
    folderId = activeFolderId
  ) => {
    const targetFolderId =
      folderId === DEFAULT_ALL_FOLDER_ID
        ? folders.find(f => !f.isDefault)?.id || 'folder-favorites'
        : folderId;

    const current = getFolderCardCounts(targetFolderId, card.id);
    const newReg = isFoil ? current.regular : current.regular + 1;
    const newFoil = isFoil ? current.foil + 1 : current.foil;

    await collectionRepository.updateCardCopies(targetFolderId, card, newReg, newFoil);
    await reloadCollection();
  };

  // Quitar rápido
  const quickRemoveCard = async (
    cardId: string,
    isFoil = false,
    folderId = activeFolderId
  ) => {
    const targetFolderId =
      folderId === DEFAULT_ALL_FOLDER_ID
        ? folders.find(f => !f.isDefault)?.id || 'folder-favorites'
        : folderId;

    const current = getFolderCardCounts(targetFolderId, cardId);
    const newReg = isFoil ? current.regular : Math.max(0, current.regular - 1);
    const newFoil = isFoil ? Math.max(0, current.foil - 1) : current.foil;

    const card = allCollectionItems.find(i => i.cardId === cardId)?.card;
    if (card) {
      await collectionRepository.updateCardCopies(targetFolderId, card, newReg, newFoil);
      await reloadCollection();
    }
  };

  // Estadísticas calculadas de la carpeta activa
  const stats: FolderStats = useMemo(() => {
    let totalRegular = 0;
    let totalFoil = 0;
    let estimatedValueUsd = 0;

    for (const item of currentFolderItems) {
      totalRegular += item.regularCount;
      totalFoil += item.foilCount;

      const regularPrice = item.card.prices?.market ?? item.card.prices?.usd ?? 0;
      const foilPrice = item.card.prices?.foil ?? (regularPrice > 0 ? regularPrice * 2.5 : 0);

      estimatedValueUsd += item.regularCount * regularPrice + item.foilCount * foilPrice;
    }

    return {
      uniqueCards: currentFolderItems.length,
      totalCopies: totalRegular + totalFoil,
      totalRegular,
      totalFoil,
      estimatedValueUsd,
    };
  }, [currentFolderItems]);

  const value = useMemo(
    () => ({
      folders,
      activeFolderId,
      activeFolder,
      setActiveFolderId,
      createFolder,
      deleteFolder,
      currentFolderItems,
      allCollectionItems,
      getCardOwnership,
      getFolderCardCounts,
      setCardCopiesInFolder,
      quickAddCard,
      quickRemoveCard,
      stats,
      reloadCollection,
    }),
    [
      folders,
      activeFolderId,
      activeFolder,
      currentFolderItems,
      allCollectionItems,
      getCardOwnership,
      getFolderCardCounts,
      stats,
      reloadCollection,
    ]
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
};

export const useCollection = () => useContext(CollectionContext);
