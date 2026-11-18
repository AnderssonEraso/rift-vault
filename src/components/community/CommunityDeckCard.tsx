import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CommunityDeck } from '@/types/community';
import { useCollection } from '@/context/CollectionContext';
import { useDecks } from '@/context/DeckContext';
import { analyzeDeckCollection } from '@/utils/deckCollectionAnalysis';
import { CommunityDeckRepository } from '@/services/communityDeckRepository';

interface CommunityDeckCardProps {
  item: CommunityDeck;
  onLikeToggle?: (deckId: string) => void;
  onViewDeck?: (deck: CommunityDeck) => void;
  onClonedSuccess?: (deckName: string) => void;
}

export const CommunityDeckCard: React.FC<CommunityDeckCardProps> = ({
  item,
  onLikeToggle,
  onViewDeck,
  onClonedSuccess,
}) => {
  const { getCardOwnership } = useCollection();
  const { importDeck } = useDecks();

  // Cruce automático con la colección física local del usuario
  const collectionAnalysis = useMemo(() => {
    if (!item.deckData) return null;
    try {
      return analyzeDeckCollection(item.deckData, getCardOwnership);
    } catch {
      return null;
    }
  }, [item.deckData, getCardOwnership]);

  // Color temático del dominio principal
  const getDomainColor = (domain?: string) => {
    switch (domain?.toLowerCase()) {
      case 'fury':
        return '#EF4444';
      case 'calm':
        return '#38BDF8';
      case 'mind':
        return '#A855F7';
      case 'body':
        return '#10B981';
      case 'chaos':
        return '#F59E0B';
      default:
        return '#E2E8F0';
    }
  };

  const domainColor = getDomainColor(item.primaryDomain);

  // Acción de clonar en 1 clic
  const handleCloneDeck = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }

      await importDeck(item.deckData);
      await CommunityDeckRepository.incrementCloneCount(item.id);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      Alert.alert(
        '¡Mazo Clonado!',
        `El mazo "${item.title}" fue agregado con éxito a tus mazos personales. Puedes editarlo y personalizarlo.`
      );
      onClonedSuccess?.(item.title);
    } catch (err) {
      Alert.alert('Error', 'No se pudo clonar el mazo.');
    }
  };

  const handleLike = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onLikeToggle?.(item.id);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Cabecera del autor y fecha */}
      <View style={styles.authorRow}>
        <View style={styles.authorInfo}>
          {item.authorAvatar ? (
            <Image source={{ uri: item.authorAvatar }} style={styles.authorAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={14} color="#94A3B8" />
            </View>
          )}
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.authorName} numberOfLines={1}>
              {item.authorName}
            </Text>
            <Text style={styles.dateSub}>Comunidad Riftbound</Text>
          </View>
        </View>

        {/* Tier badge si aplica */}
        {item.tier && (
          <View
            style={[
              styles.tierBadge,
              item.tier === 'S' && styles.tierS,
              item.tier === 'A' && styles.tierA,
              item.tier === 'B' && styles.tierB,
            ]}
          >
            <Text style={styles.tierBadgeText}>Tier {item.tier}</Text>
          </View>
        )}
      </View>

      {/* Cuerpo principal de la tarjeta */}
      <TouchableOpacity
        style={styles.mainBodyRow}
        onPress={() => onViewDeck?.(item)}
        activeOpacity={0.85}
      >
        {/* Imagen de la Leyenda */}
        {item.legendImageUrl ? (
          <Image source={{ uri: item.legendImageUrl }} style={styles.legendThumb} />
        ) : (
          <View style={[styles.legendPlaceholder, { borderColor: domainColor }]}>
            <Ionicons name="shield" size={24} color={domainColor} />
          </View>
        )}

        <View style={styles.deckDetails}>
          <Text style={styles.deckTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.legendMetaRow}>
            <View style={[styles.domainDot, { backgroundColor: domainColor }]} />
            <Text style={styles.legendMetaText} numberOfLines={1}>
              {item.legendName || 'Leyenda'} • {item.primaryDomain.toUpperCase()}
            </Text>
          </View>

          {item.description ? (
            <Text style={styles.deckDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {/* Tags */}
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>

      {/* Cruce Automático con la Colección Física Local */}
      {collectionAnalysis && (
        <View style={styles.collectionCrossBanner}>
          <Ionicons
            name={collectionAnalysis.isFullyOwned ? 'checkmark-circle' : 'cube-outline'}
            size={15}
            color={
              collectionAnalysis.isFullyOwned
                ? '#10B981'
                : collectionAnalysis.completionPercentage >= 75
                ? '#38BDF8'
                : collectionAnalysis.completionPercentage >= 50
                ? '#F59E0B'
                : '#EF4444'
            }
          />
          <Text style={styles.collectionCrossText}>
            {collectionAnalysis.isFullyOwned ? (
              <Text style={{ color: '#10B981', fontWeight: '700' }}>
                ¡Tienes el 100% de las cartas en físico!
              </Text>
            ) : (
              <>
                Posees el{' '}
                <Text
                  style={{
                    fontWeight: '700',
                    color:
                      collectionAnalysis.completionPercentage >= 75
                        ? '#38BDF8'
                        : collectionAnalysis.completionPercentage >= 50
                        ? '#F59E0B'
                        : '#EF4444',
                  }}
                >
                  {collectionAnalysis.completionPercentage}%
                </Text>{' '}
                de las cartas ({collectionAnalysis.totalOwnedCards}/{collectionAnalysis.totalRequiredCards})
              </>
            )}
          </Text>
          <Text style={styles.priceMeta}>
            ${(item.priceUsd || 0).toFixed(2)} USD
          </Text>
        </View>
      )}

      {/* Barra de Acciones y Métricas */}
      <View style={styles.footerRow}>
        <View style={styles.metricsGroup}>
          {/* Botón de Like interactivo */}
          <TouchableOpacity
            style={[styles.likeButton, item.isLikedByMe && styles.likeButtonActive]}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.isLikedByMe ? 'heart' : 'heart-outline'}
              size={16}
              color={item.isLikedByMe ? '#EF4444' : '#94A3B8'}
            />
            <Text
              style={[
                styles.likeCountText,
                item.isLikedByMe && { color: '#EF4444', fontWeight: '700' },
              ]}
            >
              {item.likesCount}
            </Text>
          </TouchableOpacity>

          {/* Contador de clones */}
          <View style={styles.cloneMetric}>
            <Ionicons name="copy-outline" size={14} color="#64748B" />
            <Text style={styles.cloneCountText}>{item.clonesCount} clones</Text>
          </View>
        </View>

        {/* Botón "Clonar Mazo" (1 Clic) */}
        <TouchableOpacity
          style={styles.cloneActionBtn}
          onPress={handleCloneDeck}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.cloneActionText}>Clonar Mazo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  dateSub: {
    fontSize: 10,
    color: '#64748B',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierS: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#EAB308',
  },
  tierA: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  tierB: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  mainBodyRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  legendThumb: {
    width: 65,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  legendPlaceholder: {
    width: 65,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#090D14',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  deckTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 20,
  },
  legendMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  domainDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendMetaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  deckDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  collectionCrossBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D14',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 6,
  },
  collectionCrossText: {
    flex: 1,
    fontSize: 11,
    color: '#CBD5E1',
  },
  priceMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 5,
  },
  likeButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  likeCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  cloneMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cloneCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  cloneActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cloneActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
