import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TCG_THEME } from '@/constants/tcgTheme';
import { useCollection } from '@/context/CollectionContext';

interface FolderSelectorProps {
  onOpenCreateModal: () => void;
}

export const FolderSelector = ({ onOpenCreateModal }: FolderSelectorProps) => {
  const { folders, activeFolderId, setActiveFolderId } = useCollection();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {folders.map(folder => {
          const isActive = activeFolderId === folder.id;
          const folderColor = folder.color || TCG_THEME.colors.gold;

          return (
            <TouchableOpacity
              key={folder.id}
              activeOpacity={0.75}
              onPress={() => setActiveFolderId(folder.id)}
              style={[
                styles.folderChip,
                isActive && {
                  borderColor: folderColor,
                  backgroundColor: TCG_THEME.colors.cardHighlight,
                },
              ]}
            >
              <Text style={styles.folderIcon}>{folder.icon}</Text>
              <Text
                style={[
                  styles.folderName,
                  isActive && {
                    color: folderColor,
                    fontWeight: '800',
                  },
                ]}
                numberOfLines={1}
              >
                {folder.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Botón para crear nueva carpeta */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenCreateModal}
          style={styles.createFolderBtn}
        >
          <Text style={styles.createPlus}>+</Text>
          <Text style={styles.createText}>Nueva Carpeta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TCG_THEME.colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  folderIcon: {
    fontSize: 13,
  },
  folderName: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  createFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 200, 185, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: TCG_THEME.colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  createPlus: {
    color: TCG_THEME.colors.cyan,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 16,
  },
  createText: {
    color: TCG_THEME.colors.cyan,
    fontSize: 11,
    fontWeight: '700',
  },
});
