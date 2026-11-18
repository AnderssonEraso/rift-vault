import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TCG_THEME } from '@/constants/tcgTheme';

interface CreateFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, icon: string, color: string) => Promise<any>;
}

const ICONS = ['📁', '⭐', '⚔️', '🛡️', '💎', '🔄', '📜', '🔮', '🏆', '🔥'];
const COLORS = [
  '#C8AA6E', // Oro Hextech
  '#0AC8B9', // Cian Hextech
  '#E84057', // Carmesí Noxus
  '#A335EE', // Púrpura Vacío
  '#207AC7', // Azul Jonia
  '#E5A823', // Ámbar Shurima
];

export const CreateFolderModal = ({
  visible,
  onClose,
  onCreate,
}: CreateFolderModalProps) => {
  const [folderName, setFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [selectedColor, setSelectedColor] = useState('#C8AA6E');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!folderName.trim()) return;
    try {
      setIsSubmitting(true);
      await onCreate(folderName.trim(), selectedIcon, selectedColor);
      setFolderName('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>NUEVA CARPETA DE COLECCIÓN</Text>
          <Text style={styles.subtitle}>
            Organiza tus cartas en mazos temáticos, listas de intercambio o favoritos.
          </Text>

          {/* Campo de Nombre */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>NOMBRE DE LA CARPETA</Text>
            <TextInput
              style={styles.input}
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Ej. Mazo Yasuo Tempest, Trade List..."
              placeholderTextColor={TCG_THEME.colors.textMuted}
              autoFocus
            />
          </View>

          {/* Selector de Emoji / Icono */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>ICONO</Text>
            <View style={styles.iconsRow}>
              {ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={[
                    styles.iconButton,
                    selectedIcon === icon && styles.iconButtonSelected,
                  ]}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selector de Color */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>COLOR DISTINTIVO</Text>
            <View style={styles.colorsRow}>
              {COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorDotSelected,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={!folderName.trim() || isSubmitting}
              style={[
                styles.createBtn,
                !folderName.trim() && styles.createBtnDisabled,
              ]}
            >
              <Text style={styles.createText}>CREAR CARPETA</Text>
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
    backgroundColor: 'rgba(7, 10, 15, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: TCG_THEME.colors.backgroundElevated,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: TCG_THEME.colors.borderHighlight,
    padding: 20,
    gap: 16,
  },
  title: {
    color: TCG_THEME.colors.gold,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  subtitle: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    color: TCG_THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: TCG_THEME.colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TCG_THEME.colors.textPrimary,
    fontSize: 13,
  },
  section: {
    gap: 8,
  },
  iconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: TCG_THEME.colors.card,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonSelected: {
    borderColor: TCG_THEME.colors.cyan,
    backgroundColor: 'rgba(10, 200, 185, 0.15)',
  },
  iconText: {
    fontSize: 16,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  createBtn: {
    backgroundColor: 'rgba(200, 170, 110, 0.15)',
    borderWidth: 1.5,
    borderColor: TCG_THEME.colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnDisabled: {
    opacity: 0.4,
    borderColor: TCG_THEME.colors.border,
  },
  createText: {
    color: TCG_THEME.colors.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
