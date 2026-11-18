import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Deck } from '@/types/deck';
import { CommunityDeck } from '@/types/community';
import { CommunityDeckRepository } from '@/services/communityDeckRepository';
import { useAuth } from '@/context/AuthContext';

const AVAILABLE_TAGS = [
  'Competitivo',
  'Budget',
  'Fun',
  'Aggro',
  'Control',
  'Midrange',
  'Combo',
  'Torneo',
  'Novatos',
];

interface PublishDeckModalProps {
  visible: boolean;
  deck: Deck;
  onClose: () => void;
  onPublishedSuccess?: (deck: CommunityDeck) => void;
}

export const PublishDeckModal: React.FC<PublishDeckModalProps> = ({
  visible,
  deck,
  onClose,
  onPublishedSuccess,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(deck.name);
  const [authorName, setAuthorName] = useState(
    user?.username || user?.email?.split('@')[0] || 'Invocador de la Grieta'
  );
  const [description, setDescription] = useState(deck.description || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Competitivo']);
  const [isPublishing, setIsPublishing] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter(t => t !== tag));
      }
    } else {
      if (selectedTags.length < 4) {
        setSelectedTags([...selectedTags, tag]);
      } else {
        Alert.alert('Límite de etiquetas', 'Puedes seleccionar un máximo de 4 etiquetas.');
      }
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Título requerido', 'Por favor ingresa un título para el mazo.');
      return;
    }

    try {
      setIsPublishing(true);
      const published = await CommunityDeckRepository.publishDeck({
        deck,
        title: title.trim(),
        description: description.trim(),
        tags: selectedTags,
        authorName: authorName.trim(),
      });

      Alert.alert(
        '¡Mazo Publicado!',
        `Tu mazo "${published.title}" ya está disponible en el Hub de la Comunidad para que otros jugadores lo prueben y voten.`
      );
      onPublishedSuccess?.(published);
      onClose();
    } catch (e) {
      Alert.alert('Error', 'No se pudo publicar el mazo en este momento.');
    } finally {
      setIsPublishing(false);
    }
  };

  const domainColor = deck.color || '#3B82F6';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: `${domainColor}22` }]}>
              <Ionicons name="globe-outline" size={24} color={domainColor} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Publicar en la Comunidad</Text>
              <Text style={styles.subtitle}>Comparte tu mazo y estrategia en el Hub público</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Vista previa miniatura del mazo */}
            <View style={styles.previewBox}>
              {deck.legendCard?.imageUrl ? (
                <Image source={{ uri: deck.legendCard.imageUrl }} style={styles.legendThumb} />
              ) : (
                <View style={[styles.legendThumbPlaceholder, { borderColor: domainColor }]}>
                  <Ionicons name="shield" size={20} color={domainColor} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.previewDeckName} numberOfLines={1}>
                  {deck.name}
                </Text>
                <Text style={styles.previewLegendName}>
                  {deck.legendCard?.name || 'Sin Leyenda'} • Dominio {deck.domains?.[0] || 'Order'}
                </Text>
                <Text style={styles.previewPrice}>
                  Coste est. ${(deck.priceUsd || 0).toFixed(2)} USD
                </Text>
              </View>
            </View>

            {/* Input: Título de publicación */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Título público del mazo</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. Vi Aggro Rush (Top 8 Regional)"
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Input: Nombre del autor */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Autor / Creador</Text>
              <TextInput
                style={styles.textInput}
                value={authorName}
                onChangeText={setAuthorName}
                placeholder="Tu apodo de jugador"
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Input: Guía o notas del mazo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Guía rápida / Estrategia (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Explica cómo jugar la mano inicial, combos clave o sustitutos económicos..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Selección de Etiquetas (Tags) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Etiquetas de juego (máx. 4)</Text>
              <View style={styles.tagsContainer}>
                {AVAILABLE_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[styles.tagChipText, isSelected && styles.tagChipTextSelected]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Botón de Publicación */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.publishBtn, isPublishing && styles.publishBtnDisabled]}
              onPress={handlePublish}
              disabled={isPublishing}
              activeOpacity={0.85}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.publishBtnText}>Publicar Mazo Ahora</Text>
                </>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
  closeBtn: {
    padding: 6,
  },
  bodyScroll: {
    maxHeight: 380,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D14',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 10,
    marginBottom: 14,
  },
  legendThumb: {
    width: 40,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  legendThumbPlaceholder: {
    width: 40,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewDeckName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  previewLegendName: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  previewPrice: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  tagChipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tagChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerRow: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
  },
  publishBtnDisabled: {
    opacity: 0.6,
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
