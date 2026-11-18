import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Deck } from '@/types/deck';
import { parseDeckImport } from '@/utils/deckExportImport';

interface ImportDeckModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (deck: Deck) => Promise<any>;
}

export const ImportDeckModal: React.FC<ImportDeckModalProps> = ({
  visible,
  onClose,
  onImport,
}) => {
  const [inputText, setInputText] = useState('');
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    deck?: Partial<Deck>;
    error?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setParseResult(null);
      return;
    }
    const result = parseDeckImport(text);
    setParseResult(result);
  };

  const handleConfirmImport = async () => {
    if (!parseResult || !parseResult.success || !parseResult.deck) return;
    try {
      setIsSubmitting(true);
      await onImport(parseResult.deck as Deck);
      setInputText('');
      setParseResult(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewDeck = parseResult?.deck;
  const totalCardsCount = previewDeck
    ? (previewDeck.mainUnits?.reduce((acc, s) => acc + s.count, 0) || 0) +
      (previewDeck.mainSpells?.reduce((acc, s) => acc + s.count, 0) || 0) +
      (previewDeck.mainGear?.reduce((acc, s) => acc + s.count, 0) || 0) +
      (previewDeck.battlefields?.reduce((acc, s) => acc + s.count, 0) || 0)
    : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="download-outline" size={24} color="#3B82F6" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Importar Mazo</Text>
              <Text style={styles.subtitle}>
                Pega un código de mazo (RIFT1-...), JSON o lista de cartas en texto.
              </Text>
            </View>
          </View>

          {/* Text Area para pegar el contenido */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={handleTextChange}
              placeholder="Pega aquí el código RIFT1-..., JSON o lista de texto..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={6}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {inputText.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => handleTextChange('')}
              >
                <Ionicons name="close-circle" size={18} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Vista previa o error detectado */}
          {parseResult && (
            <View style={styles.previewSection}>
              {parseResult.success && previewDeck ? (
                <View
                  style={[
                    styles.previewCard,
                    { borderLeftColor: previewDeck.color || '#3B82F6' },
                  ]}
                >
                  <View style={styles.previewTopRow}>
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: `${previewDeck.color || '#3B82F6'}22` },
                      ]}
                    >
                      <Ionicons
                        name={(previewDeck.icon || 'sparkles') as any}
                        size={20}
                        color={previewDeck.color || '#3B82F6'}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.previewDeckName} numberOfLines={1}>
                        {previewDeck.name}
                      </Text>
                      <Text style={styles.previewMeta}>
                        {previewDeck.legendCard ? `Leyenda: ${previewDeck.legendCard.name} • ` : ''}
                        {totalCardsCount} cartas detectadas
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text style={styles.errorText}>
                    {parseResult.error || 'Formato no reconocido.'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Acciones */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmImport}
              disabled={!parseResult?.success || isSubmitting}
              style={[
                styles.importBtn,
                (!parseResult?.success || isSubmitting) && styles.importBtnDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.importText}>IMPORTAR MAZO</Text>
              )}
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
    maxWidth: 480,
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
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
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
  inputContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  textInput: {
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 13,
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  clearBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  previewSection: {
    marginBottom: 14,
  },
  previewCard: {
    backgroundColor: '#131D31',
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 12,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewDeckName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  previewMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    flex: 1,
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
  importBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
  },
  importBtnDisabled: {
    opacity: 0.4,
  },
  importText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
