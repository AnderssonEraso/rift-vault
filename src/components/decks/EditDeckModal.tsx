import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Deck } from '@/types/deck';
import { TCG_THEME } from '@/constants/tcgTheme';
import { DECK_COLOR_PALETTE, DECK_ICON_LIST } from '@/utils/deckExportImport';

interface EditDeckModalProps {
  visible: boolean;
  deck: Deck;
  onClose: () => void;
  onSave: (updates: { name: string; description: string; color: string; icon: string }) => void;
}

export const EditDeckModal: React.FC<EditDeckModalProps> = ({
  visible,
  deck,
  onClose,
  onSave,
}) => {
  const [deckName, setDeckName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description || '');
  const [selectedColor, setSelectedColor] = useState(deck.color || DECK_COLOR_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState(deck.icon || DECK_ICON_LIST[0]);

  useEffect(() => {
    setDeckName(deck.name);
    setDescription(deck.description || '');
    setSelectedColor(deck.color || DECK_COLOR_PALETTE[0]);
    setSelectedIcon(deck.icon || DECK_ICON_LIST[0]);
  }, [deck]);

  const handleSave = () => {
    if (!deckName.trim()) return;
    onSave({
      name: deckName.trim(),
      description: description.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header con vista previa del icono y color */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconPreviewBox,
                { backgroundColor: `${selectedColor}22`, borderColor: selectedColor },
              ]}
            >
              <Ionicons name={selectedIcon as any} size={28} color={selectedColor} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Personalizar Mazo</Text>
              <Text style={styles.subtitle}>
                Modifica el nombre, icono y color de identificación.
              </Text>
            </View>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Nombre del Mazo */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>NOMBRE DEL MAZO</Text>
              <TextInput
                style={styles.input}
                value={deckName}
                onChangeText={setDeckName}
                placeholder="Nombre del mazo..."
                placeholderTextColor={TCG_THEME.colors.textMuted}
              />
            </View>

            {/* Selector de Color */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>COLOR DISTINTIVO</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorRow}
              >
                {DECK_COLOR_PALETTE.map(color => {
                  const isSelected = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        isSelected && styles.colorSwatchSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                      activeOpacity={0.8}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Selector de Icono */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>ÍCONO DEL MAZO</Text>
              <View style={styles.iconGrid}>
                {DECK_ICON_LIST.map(iconName => {
                  const isSelected = selectedIcon === iconName;
                  return (
                    <TouchableOpacity
                      key={iconName}
                      style={[
                        styles.iconButton,
                        isSelected && {
                          backgroundColor: `${selectedColor}26`,
                          borderColor: selectedColor,
                        },
                      ]}
                      onPress={() => setSelectedIcon(iconName)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={iconName as any}
                        size={20}
                        color={isSelected ? selectedColor : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Estrategia / Descripción */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>ESTRATEGIA / DESCRIPCIÓN</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Notas o combos clave..."
                placeholderTextColor={TCG_THEME.colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!deckName.trim()}
              style={[
                styles.saveBtn,
                { backgroundColor: selectedColor },
                !deckName.trim() && styles.saveBtnDisabled,
              ]}
            >
              <Text style={styles.saveText}>GUARDAR CAMBIOS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '85%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconPreviewBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  bodyScroll: {
    marginBottom: 12,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
