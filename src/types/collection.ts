import { RiftCard } from '@/types/card';

/**
 * Representa una carpeta de organización en la base de datos (mapeo Supabase: tabla `folders`)
 */
export interface CollectionFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  description?: string;
  createdAt: string;
}

/**
 * Representa la asignación de cartas por carpeta (mapeo Supabase: tabla `folder_cards`)
 */
export interface FolderCardItem {
  id: string;
  folderId: string;
  cardId: string;
  card: RiftCard;
  regularCount: number;
  foilCount: number;
  count?: number; // Alias total copias (regularCount + foilCount)
  updatedAt: string;
}

/**
 * Resumen consolidado para una carta en particular en todo el inventario
 */
export interface CardOwnershipSummary {
  cardId: string;
  totalRegular: number;
  totalFoil: number;
  totalCopies: number;
  folderIds: string[];
}

/**
 * Estadísticas calculadas de la colección o carpeta
 */
export interface FolderStats {
  uniqueCards: number;
  totalCopies: number;
  totalRegular: number;
  totalFoil: number;
  estimatedValueUsd: number;
}
