import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Deck } from '@/types/deck';
import { validateRiftDeck } from '@/utils/deckValidation';
import { useCollection } from '@/context/CollectionContext';
import { analyzeDeckCollection } from '@/utils/deckCollectionAnalysis';
import { getCardImageUrl } from '@/services/openRiftApi';

interface DeckListItemProps {
  deck: Deck;
  onPress: (deck: Deck) => void;
  onShowValidationErrors?: (errors: string[]) => void;
}

export const DeckListItem: React.FC<DeckListItemProps> = ({
  deck,
  onPress,
  onShowValidationErrors,
}) => {
  const legality = validateRiftDeck(deck);
  const { getCardOwnership } = useCollection();
  const collectionAnalysis = useMemo(
    () => analyzeDeckCollection(deck, getCardOwnership),
    [deck, getCardOwnership]
  );

  // Iconos de facciones/dominios según colores oficiales
  const getDomainColor = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'calm':
        return '#0AC8B9';
      case 'order':
        return '#EAB308';
      case 'fury':
        return '#EF4444';
      case 'shadow':
        return '#A855F7';
      case 'mind':
        return '#3B82F6';
      default:
        return '#64748B';
    }
  };

  const deckColor = deck.color || '#3B82F6';
  const deckIcon = deck.icon || 'sparkles';

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        { borderLeftColor: deckColor, borderLeftWidth: 4 },
        !legality.isValid && styles.invalidCardBorder,
      ]}
      onPress={() => onPress(deck)}
      activeOpacity={0.85}
    >
      {/* Miniatura vertical de la carta de Campeón / Portada Fiel a Screenshot 5 */}
      <View style={styles.coverWrapper}>
        <Image
          source={{
            uri:
              deck.coverImage ||
              getCardImageUrl(deck.legendCard) ||
              'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Zed_0.jpg',
          }}
          style={styles.coverImage}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
        {deck.legendCard && (
          <View style={styles.legendBadge}>
            <Text style={styles.legendBadgeText}>LEYENDA</Text>
          </View>
        )}
      </View>

      {/* Iconos de Dominios / Facciones apilados verticalmente Fiel a Screenshot 5 */}
      <View style={styles.domainsColumn}>
        {deck.domains.map((dom, i) => (
          <View
            key={i}
            style={[
              styles.domainIconCircle,
              { borderColor: getDomainColor(dom) },
            ]}
          >
            <Ionicons
              name={
                dom === 'fury'
                  ? 'flame'
                  : dom === 'calm'
                  ? 'water'
                  : dom === 'order'
                  ? 'shield'
                  : dom === 'shadow'
                  ? 'moon'
                  : 'eye'
              }
              size={14}
              color={getDomainColor(dom)}
            />
          </View>
        ))}
      </View>

      {/* Información del Mazo */}
      <View style={styles.detailsContainer}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.customIconBadge,
              { backgroundColor: `${deckColor}22`, borderColor: `${deckColor}55` },
            ]}
          >
            <Ionicons name={deckIcon as any} size={14} color={deckColor} />
          </View>
          <Text style={styles.deckName} numberOfLines={1}>
            {deck.name}
          </Text>
        </View>

        <View style={styles.metaRow}>
          {/* Disponibilidad en Físico */}
          <View
            style={[
              styles.collectionPill,
              collectionAnalysis.isFullyOwned && styles.collectionPillComplete,
            ]}
          >
            <Ionicons
              name={collectionAnalysis.isFullyOwned ? 'checkmark-circle' : 'cube-outline'}
              size={11}
              color={collectionAnalysis.isFullyOwned ? '#10B981' : '#F59E0B'}
              style={{ marginRight: 3 }}
            />
            <Text
              style={[
                styles.collectionPillText,
                collectionAnalysis.isFullyOwned && styles.collectionPillTextComplete,
              ]}
            >
              {collectionAnalysis.completionPercentage}% físico
            </Text>
          </View>

          {/* Precio estimado en USD */}
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>
              ${(deck.priceUsd || 5.0).toFixed(2)}
            </Text>
          </View>

          {/* Contador de vistas */}
          <View style={styles.viewsPill}>
            <Ionicons name="eye-outline" size={12} color="#8E9AA8" style={{ marginRight: 4 }} />
            <Text style={styles.viewsText}>{deck.viewsCount || 0} vistas</Text>
          </View>

          {/* Insignia de No Válido Fiel a Screenshot 5 */}
          {!legality.isValid && (
            <TouchableOpacity
              style={styles.invalidBadge}
              onPress={() => onShowValidationErrors?.(legality.errors)}
            >
              <Ionicons name="warning-outline" size={13} color="#EF4444" style={{ marginRight: 3 }} />
              <Text style={styles.invalidText}>No válido</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1522',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  invalidCardBorder: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  coverWrapper: {
    width: 64,
    height: 84,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  legendBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  legendBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  domainsColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  domainIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#161F30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deckName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  collectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  collectionPillComplete: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  collectionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  collectionPillTextComplete: {
    color: '#10B981',
  },
  pricePill: {
    backgroundColor: '#161F30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#26334D',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  viewsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161F30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#26334D',
  },
  viewsText: {
    fontSize: 11,
    color: '#8E9AA8',
  },
  invalidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  invalidText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});
