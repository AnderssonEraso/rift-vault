import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { RiftCard } from '@/types/card';
import { TCG_THEME } from '@/constants/tcgTheme';
import { useLanguage } from '@/context/LanguageContext';
import { useCollection } from '@/context/CollectionContext';

interface CardItemProps {
  card: RiftCard;
  onPress: (card: RiftCard) => void;
}

export const CardItem = memo(({ card, onPress }: CardItemProps) => {
  const { t } = useLanguage();
  const { getCardOwnership } = useCollection();

  const domainColor = TCG_THEME.domainColors[card.primaryDomain] ?? TCG_THEME.domainColors.Default;
  const cardRarity = card.rarity || 'Common';
  const cardType = card.type || card.cardType || 'Unit';
  const rarityColor = TCG_THEME.rarityColors[cardRarity] ?? TCG_THEME.rarityColors.Common;

  const translatedDomain = t.domains[card.primaryDomain] ?? card.primaryDomain;
  const translatedType = t.types[cardType] ?? cardType;

  const ownership = getCardOwnership(card.id);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onPress(card)}
      style={styles.cardContainer}
      accessibilityRole="button"
      accessibilityLabel={`${card.name}, ${card.energyCost} ${t.energyLabel}, ${translatedDomain}, ${ownership.totalCopies} en colección`}
    >
      <View style={[styles.cardWrapper, ownership.totalCopies > 0 && styles.cardWrapperOwned]}>
        {/* Contenedor de imagen TCG con Lazy Loading */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: card.thumbnailUrl }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={card.id}
            priority="normal"
            placeholder={TCG_THEME.colors.cardHighlight}
          />

          {/* Badge de Costo de Energía Hextech (Arriba a la izquierda) */}
          <View style={styles.energyBadge}>
            <View style={styles.energyGlow} />
            <Text style={styles.energyText}>{card.energyCost}</Text>
          </View>

          {/* Indicador de Dominio / Facción (Arriba a la derecha) */}
          <View style={[styles.domainBadge, { borderColor: domainColor }]}>
            <View style={[styles.domainDot, { backgroundColor: domainColor }]} />
            <Text style={styles.domainText}>{translatedDomain}</Text>
          </View>

          {/* Badge de Posesión en la Colección (Si total > 0) */}
          {ownership.totalCopies > 0 && (
            <View style={styles.ownedBadge}>
              <Text style={styles.ownedBadgeText}>
                ✓ x{ownership.totalCopies}
                {ownership.totalFoil > 0 ? ` (${ownership.totalFoil}★)` : ''}
              </Text>
            </View>
          )}

          {/* Indicador de Rareza */}
          <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />

          {/* Estadísticas de combate (Poder / Vida) */}
          {(card.power !== undefined || card.health !== undefined) && (
            <View style={styles.statsBadge}>
              <Text style={styles.statsText}>
                {card.power ?? 0} <Text style={styles.statsDivider}>/</Text> {card.health ?? 0}
              </Text>
            </View>
          )}
        </View>

        {/* Pie de la tarjeta */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardName} numberOfLines={1}>
            {card.name}
          </Text>
          <View style={styles.subRow}>
            <Text style={styles.cardType} numberOfLines={1}>
              {translatedType}
              {card.subtypes && card.subtypes.length > 0 ? ` • ${card.subtypes[0]}` : ''}
            </Text>
            {card.prices?.market != null && (
              <Text style={styles.cardPrice}>${card.prices.market.toFixed(2)}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

CardItem.displayName = 'CardItem';

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 6,
    maxWidth: '50%',
  },
  cardWrapper: {
    backgroundColor: TCG_THEME.colors.card,
    borderRadius: TCG_THEME.borderRadius,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  cardWrapperOwned: {
    borderColor: TCG_THEME.colors.goldDark,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: TCG_THEME.cardAspectRatio,
    position: 'relative',
    backgroundColor: TCG_THEME.colors.backgroundElevated,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  energyBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#071A1E',
    borderWidth: 1.5,
    borderColor: TCG_THEME.colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TCG_THEME.colors.cyanGlow,
  },
  energyText: {
    color: TCG_THEME.colors.cyan,
    fontSize: 12,
    fontWeight: '800',
  },
  domainBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 14, 20, 0.88)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  domainDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  domainText: {
    color: TCG_THEME.colors.textPrimary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ownedBadge: {
    position: 'absolute',
    top: 36,
    left: 6,
    backgroundColor: 'rgba(11, 14, 20, 0.92)',
    borderWidth: 1,
    borderColor: TCG_THEME.colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownedBadgeText: {
    color: TCG_THEME.colors.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  rarityIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0B0E14',
  },
  statsBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(11, 14, 20, 0.88)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.goldDark,
  },
  statsText: {
    color: TCG_THEME.colors.gold,
    fontSize: 10,
    fontWeight: '800',
  },
  statsDivider: {
    color: TCG_THEME.colors.textMuted,
  },
  cardFooter: {
    padding: 8,
    backgroundColor: TCG_THEME.colors.card,
    borderTopWidth: 1,
    borderTopColor: 'rgba(38, 48, 66, 0.6)',
  },
  cardName: {
    color: TCG_THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
  cardPrice: {
    color: TCG_THEME.colors.gold,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
});
