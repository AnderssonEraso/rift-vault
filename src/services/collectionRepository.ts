import { CollectionFolder, FolderCardItem } from '@/types/collection';
import { RiftCard } from '@/types/card';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

export const DEFAULT_ALL_FOLDER_ID = 'folder-all-general';

// Carpetas iniciales estándar del sistema (vacías, sin datos quemados)
export const INITIAL_FOLDERS: CollectionFolder[] = [
  {
    id: DEFAULT_ALL_FOLDER_ID,
    name: 'Todas mis cartas',
    icon: '📦',
    color: '#3B82F6',
    isDefault: true,
    description: 'Carpeta principal con todo tu inventario registrado.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'folder-unassigned',
    name: 'Sin carpeta',
    icon: '📦',
    color: '#3B82F6',
    isDefault: false,
    description: 'Cartas sin carpeta específica asignada.',
    createdAt: new Date().toISOString(),
  },
];

export interface ICollectionRepository {
  getFolders(): Promise<CollectionFolder[]>;
  createFolder(name: string, icon?: string, color?: string, description?: string): Promise<CollectionFolder>;
  deleteFolder(folderId: string): Promise<void>;
  renameFolder(folderId: string, name: string): Promise<void>;
  getFolderItems(folderId: string): Promise<FolderCardItem[]>;
  getAllItems(): Promise<FolderCardItem[]>;
  updateCardCopies(
    folderId: string,
    card: RiftCard,
    regularCount: number,
    foilCount: number
  ): Promise<FolderCardItem | null>;
  removeCardFromFolder(folderId: string, cardId: string): Promise<void>;
}

class HybridCollectionRepository implements ICollectionRepository {
  private localFolders: CollectionFolder[] = [...INITIAL_FOLDERS];
  private localItems: Map<string, FolderCardItem> = new Map();

  async getFolders(): Promise<CollectionFolder[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('folders')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            name: row.name,
            icon: row.icon || '📁',
            color: row.color || '#3B82F6',
            isDefault: row.is_default || false,
            description: row.description,
            createdAt: row.created_at,
          }));
        }
      } catch (e) {
        console.warn('⚠️ Supabase getFolders falló, usando almacén local:', e);
      }
    }
    return [...this.localFolders];
  }

  async createFolder(
    name: string,
    icon = '📁',
    color = '#3B82F6',
    description = ''
  ): Promise<CollectionFolder> {
    const newFolder: CollectionFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      icon,
      color,
      isDefault: false,
      description,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('folders')
          .insert([
            {
              name: newFolder.name,
              icon: newFolder.icon,
              color: newFolder.color,
              description: newFolder.description,
              is_default: false,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          newFolder.id = data.id;
        }
      } catch (e) {
        console.warn('⚠️ Supabase createFolder falló, guardando localmente:', e);
      }
    }

    this.localFolders.push(newFolder);
    return newFolder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    if (folderId === DEFAULT_ALL_FOLDER_ID) {
      throw new Error('No se puede eliminar la carpeta principal.');
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('folders').delete().eq('id', folderId);
      } catch (e) {
        console.warn('⚠️ Supabase deleteFolder error:', e);
      }
    }

    this.localFolders = this.localFolders.filter(f => f.id !== folderId);
    for (const [key, item] of this.localItems.entries()) {
      if (item.folderId === folderId) {
        this.localItems.delete(key);
      }
    }
  }

  async renameFolder(folderId: string, name: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('folders').update({ name: name.trim() }).eq('id', folderId);
      } catch (e) {
        console.warn('⚠️ Supabase renameFolder error:', e);
      }
    }

    const folder = this.localFolders.find(f => f.id === folderId);
    if (folder) {
      folder.name = name.trim();
    }
  }

  async getFolderItems(folderId: string): Promise<FolderCardItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const query = supabase.from('folder_cards').select('*');
        if (folderId !== DEFAULT_ALL_FOLDER_ID) {
          query.eq('folder_id', folderId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            folderId: row.folder_id,
            cardId: row.card_id,
            card: row.card_data,
            regularCount: row.regular_count,
            foilCount: row.foil_count,
            count: row.regular_count + row.foil_count,
            updatedAt: row.updated_at,
          }));
        }
      } catch (e) {
        console.warn('⚠️ Supabase getFolderItems error:', e);
      }
    }

    const items: FolderCardItem[] = [];
    for (const item of this.localItems.values()) {
      if (folderId === DEFAULT_ALL_FOLDER_ID || item.folderId === folderId) {
        items.push(item);
      }
    }
    return items;
  }

  async getAllItems(): Promise<FolderCardItem[]> {
    return this.getFolderItems(DEFAULT_ALL_FOLDER_ID);
  }

  async updateCardCopies(
    folderId: string,
    card: RiftCard,
    regularCount: number,
    foilCount: number
  ): Promise<FolderCardItem | null> {
    const key = `${folderId}_${card.id}`;
    const totalCount = regularCount + foilCount;

    if (totalCount <= 0) {
      this.localItems.delete(key);
      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('folder_cards')
            .delete()
            .eq('folder_id', folderId)
            .eq('card_id', card.id);
        } catch (e) {}
      }
      return null;
    }

    const item: FolderCardItem = {
      id: `item-${Date.now()}`,
      folderId,
      cardId: card.id,
      card,
      regularCount,
      foilCount,
      count: totalCount,
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('folder_cards').upsert({
          folder_id: folderId,
          card_id: card.id,
          card_data: card,
          regular_count: regularCount,
          foil_count: foilCount,
          updated_at: item.updatedAt,
        });
      } catch (e) {
        console.warn('⚠️ Supabase updateCardCopies error:', e);
      }
    }

    this.localItems.set(key, item);
    return item;
  }

  async removeCardFromFolder(folderId: string, cardId: string): Promise<void> {
    const key = `${folderId}_${cardId}`;
    this.localItems.delete(key);
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('folder_cards')
          .delete()
          .eq('folder_id', folderId)
          .eq('card_id', cardId);
      } catch (e) {}
    }
  }
}

export const collectionRepository = new HybridCollectionRepository();
