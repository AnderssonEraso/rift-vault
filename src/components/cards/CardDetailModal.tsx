import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RiftCard } from '@/types/card';
import { TCG_THEME } from '@/constants/tcgTheme';
import { useLanguage } from '@/context/LanguageContext';
import { useCollection } from '@/context/CollectionContext';
import { useDecks } from '@/context/DeckContext';
import { useWishlist } from '@/context/WishlistContext';

interface CardDetailModalProps {
  card: RiftCard | null;
  visible: boolean;
  onClose: () => void;
}

export const CardDetailModal = ({ card, visible, onClose }: CardDetailModalProps) => {
  const { t } = useLanguage();
  const {
    folders,
    activeFolderId,
    getCardOwnership,
    getFolderCardCounts,
    setCardCopiesInFolder,
  } = useCollection();
  const { decks, addCardToDeck, setCardCountInDeck } = useDecks();

  // Carpeta seleccionada dentro del modal para asignar copias físicas
  const [targetFolderId, setTargetFolderId] = useState<string>(activeFolderId);
  // Mazo seleccionado para añadir la carta
  const [targetDeckId, setTargetDeckId] = useState<string>(decks[0]?.id || '');

  // Wishlist
  const {
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    getWishlistItem,
    updateWishlistItem,
  } = useWishlist();

  if (!card) return null;

  const inWishlist = isInWishlist(card.id);
  const wishlistItem = getWishlistItem(card.id);

  const handleToggleWishlist = async () => {
    if (inWishlist) {
      await removeFromWishlist(card.id);
    } else {
      await addToWishlist({
        card,
        targetQuantity: 1,
        isFoil: false,
        priority: 'media',
        targetPrice: card.marketPriceUsd || card.prices?.usd || null,
      });
    }
  };

  const domainColor = TCG_THEME.domainColors[card.primaryDomain] ?? TCG_THEME.domainColors.Default;
  const cardRarity = card.rarity || 'Common';
  const cardType = card.type || card.cardType || 'Unit';
  const rarityColor = TCG_THEME.rarityColors[cardRarity] ?? TCG_THEME.rarityColors.Common;

  const translatedType = t.types[cardType] ?? cardType;
  const translatedRarity = t.rarities[cardRarity] ?? cardRarity;

  // Propiedad global consolidada
  const ownership = getCardOwnership(card.id);
  // Propiedad en la carpeta elegida
  const folderCounts = getFolderCardCounts(targetFolderId, card.id);

  // Copias en el mazo seleccionado
  const selectedDeck = decks.find(d => d.id === targetDeckId) || decks[0];
  const getDeckCardCount = (d: typeof selectedDeck) => {
    if (!d) return 0;
    const all = [
      ...(d.mainUnits || []),
      ...(d.mainGear || []),
      ...(d.mainSpells || []),
      ...(d.battlefields || []),
      ...(d.sideboard || []),
    ];
    return all.filter(s => s.cardId === card.id).reduce((acc, s) => acc + s.count, 0);
  };
  const countInDeck = getDeckCardCount(selectedDeck);

  const regularPrice = card.prices?.market ?? card.prices?.usd ?? 0;
  const foilPrice = card.prices?.foil ?? (regularPrice > 0 ? regularPrice * 2.5 : 0);
  const myTotalValue = ownership.totalRegular * regularPrice + ownership.totalFoil * foilPrice;

  const handleAdjustRegular = (delta: number) => {
    const newCount = Math.max(0, folderCounts.regular + delta);
    setCardCopiesInFolder(card, targetFolderId, newCount, folderCounts.foil);
  };

  const handleAdjustFoil = (delta: number) => {
    const newCount = Math.max(0, folderCounts.foil + delta);
    setCardCopiesInFolder(card, targetFolderId, folderCounts.regular, newCount);
  };

  const handleAdjustDeckCount = (delta: number) => {
    if (!selectedDeck) return;
    const newCount = Math.max(0, Math.min(3, countInDeck + delta));
    setCardCountInDeck(selectedDeck.id, card, newCount);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Botón de Lista de Deseos (Wishlist) */}
          <TouchableOpacity
            style={[styles.wishlistIconButton, inWishlist && styles.wishlistIconButtonActive]}
            onPress={handleToggleWishlist}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Deseados"
          >
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={18}
              color={inWishlist ? '#EF4444' : '#94A3B8'}
            />
          </TouchableOpacity>

          {/* Botón de cierre en esquina superior */}
          <TouchableOpacity
            style={styles.closeIconButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t.closeModal}
          >
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Imagen en alta resolución */}
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: card.highresUrl }}
                style={styles.image}
                contentFit="contain"
                transition={300}
                cachePolicy="memory-disk"
                priority="high"
                placeholder={TCG_THEME.colors.cardHighlight}
              />
            </View>

            {/* Cabecera con Nombre y Costo de Energía */}
            <View style={styles.headerRow}>
              <View style={styles.titleColumn}>
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.cardSubtype}>
                  {translatedType}
                  {card.subtypes && card.subtypes.length > 0 ? ` • ${card.subtypes.join(', ')}` : ''}
                  {card.publicCode ? ` (#${card.publicCode})` : ''}
                </Text>
              </View>

              {/* Orbe de Energía Hextech */}
              <View style={styles.energyOrb}>
                <Text style={styles.energyOrbNumber}>{card.energyCost}</Text>
                <Text style={styles.energyOrbLabel}>{t.energyLabel}</Text>
              </View>
            </View>

            {/* Fila de Insignias: Dominios y Rareza */}
            <View style={styles.badgesRow}>
              {card.domains.map(dom => {
                const domCapitalized = dom.charAt(0).toUpperCase() + dom.slice(1).toLowerCase();
                const dColor = TCG_THEME.domainColors[domCapitalized] ?? TCG_THEME.domainColors.Default;
                const translatedDom = t.domains[domCapitalized] ?? domCapitalized;
                return (
                  <View
                    key={dom}
                    style={[styles.badge, { borderColor: dColor, backgroundColor: 'rgba(21, 27, 38, 0.9)' }]}
                  >
                    <View style={[styles.badgeDot, { backgroundColor: dColor }]} />
                    <Text style={[styles.badgeText, { color: dColor }]}>
                      {translatedDom}
                    </Text>
                  </View>
                );
              })}

              <View style={[styles.badge, { borderColor: rarityColor, backgroundColor: 'rgba(21, 27, 38, 0.9)' }]}>
                <View style={[styles.badgeDot, { backgroundColor: rarityColor }]} />
                <Text style={[styles.badgeText, { color: rarityColor }]}>
                  {translatedRarity}
                </Text>
              </View>
            </View>

            {/* ========================================================
                APARTADO 1: AÑADIR A UN MAZO (DECK BUILDER)
                ======================================================== */}
            <View style={styles.deckSection}>
              <View style={styles.vaultHeaderRow}>
                <Text style={styles.deckSectionTitle}>⚔️ {t.addToDeck}</Text>
                {countInDeck > 0 && (
                  <View style={styles.deckTag}>
                    <Text style={styles.deckTagText}>
                      {countInDeck}/3 {t.copiesInDeck}
                    </Text>
                  </View>
                )}
              </View>

              {decks.length > 0 ? (
                <>
                  <Text style={styles.folderSelectLabel}>{t.selectDeck}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.folderChipsScroll}
                  >
                    {decks.map(d => {
                      const isSelected = (targetDeckId || decks[0]?.id) === d.id;
                      const inThisDeck = getDeckCardCount(d);
                      return (
                        <TouchableOpacity
                          key={d.id}
                          onPress={() => setTargetDeckId(d.id)}
                          style={[
                            styles.folderMiniChip,
                            isSelected && styles.deckMiniChipSelected,
                          ]}
                        >
                          <Text style={styles.folderMiniIcon}>⚔️</Text>
                          <Text
                            style={[
                              styles.folderMiniText,
                              isSelected && styles.deckMiniTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {d.name} {inThisDeck > 0 ? `(${inThisDeck})` : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Controles de cantidad para el mazo */}
                  <View style={styles.deckControlsRow}>
                    <Text style={styles.deckControlsPrompt}>
                      Copias en {selectedDeck?.name}:
                    </Text>

                    <View style={styles.counterWrapper}>
                      <TouchableOpacity
                        onPress={() => handleAdjustDeckCount(-1)}
                        style={[styles.countButton, countInDeck === 0 && styles.countButtonDisabled]}
                        disabled={countInDeck === 0}
                      >
                        <Text style={styles.countButtonText}>−</Text>
                      </TouchableOpacity>

                      <View style={styles.countBadge}>
                        <Text style={styles.countNumber}>{countInDeck}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleAdjustDeckCount(1)}
                        style={[styles.countButton, countInDeck >= 3 && styles.countButtonDisabled]}
                        disabled={countInDeck >= 3}
                      >
                        <Text style={styles.countButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.noDecksNotice}>
                  No tienes ningún mazo creado aún. Ve a la pestaña 'Mis Mazos' para crear uno.
                </Text>
              )}
            </View>

            {/* ========================================================
                APARTADO 2: GESTIÓN DE POSESIÓN EN BÓVEDA / CARPETAS
                ======================================================== */}
            <View style={styles.vaultSection}>
              <View style={styles.vaultHeaderRow}>
                <Text style={styles.vaultSectionTitle}>📦 {t.manageCopies}</Text>
                {ownership.totalCopies > 0 && (
                  <View style={styles.vaultOwnedTag}>
                    <Text style={styles.vaultOwnedTagText}>
                      ✓ {ownership.totalCopies} {t.inVault}
                    </Text>
                  </View>
                )}
              </View>

              {/* Selector de Carpeta Destino */}
              <View style={styles.folderSelectWrapper}>
                <Text style={styles.folderSelectLabel}>GUARDAR EN CARPETA:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.folderChipsScroll}
                >
                  {folders.map(f => {
                    const isSelected = targetFolderId === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => setTargetFolderId(f.id)}
                        style={[
                          styles.folderMiniChip,
                          isSelected && styles.folderMiniChipSelected,
                        ]}
                      >
                        <Text style={styles.folderMiniIcon}>{f.icon}</Text>
                        <Text
                          style={[
                            styles.folderMiniText,
                            isSelected && styles.folderMiniTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {f.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Fila de Copias Normales */}
              <View style={styles.copyRow}>
                <View style={styles.copyLabelCol}>
                  <Text style={styles.copyLabelTitle}>{t.regularCountLabel}</Text>
                  <Text style={styles.copyLabelSub}>
                    {regularPrice > 0 ? `$${regularPrice.toFixed(2)} c/u` : 'Sin precio'}
                  </Text>
                </View>

                <View style={styles.counterWrapper}>
                  <TouchableOpacity
                    onPress={() => handleAdjustRegular(-1)}
                    style={[styles.countButton, folderCounts.regular === 0 && styles.countButtonDisabled]}
                    disabled={folderCounts.regular === 0}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countButtonText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.countBadge}>
                    <Text style={styles.countNumber}>{folderCounts.regular}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleAdjustRegular(1)}
                    style={styles.countButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fila de Copias Foil / Holo */}
              <View style={styles.copyRow}>
                <View style={styles.copyLabelCol}>
                  <Text style={styles.copyLabelTitleFoil}>★ {t.foilCountLabel}</Text>
                  <Text style={styles.copyLabelSub}>
                    {foilPrice > 0 ? `$${foilPrice.toFixed(2)} c/u` : 'Sin precio'}
                  </Text>
                </View>

                <View style={styles.counterWrapper}>
                  <TouchableOpacity
                    onPress={() => handleAdjustFoil(-1)}
                    style={[styles.countButton, folderCounts.foil === 0 && styles.countButtonDisabled]}
                    disabled={folderCounts.foil === 0}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countButtonText}>−</Text>
                  </TouchableOpacity>

                  <View style={[styles.countBadge, styles.countBadgeFoil]}>
                    <Text style={styles.countNumberFoil}>{folderCounts.foil}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleAdjustFoil(1)}
                    style={[styles.countButton, styles.countButtonFoil]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.countButtonText, { color: TCG_THEME.colors.gold }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Resumen total global */}
              {ownership.totalCopies > 0 && (
                <View style={styles.myValueRow}>
                  <Text style={styles.myValueLabel}>Total global en tu inventario:</Text>
                  <Text style={styles.myValueAmount}>
                    {ownership.totalRegular} norm • {ownership.totalFoil}★ foil (${myTotalValue.toFixed(2)} USD)
                  </Text>
                </View>
              )}
            </View>

            {/* Sección de Wishlist (Lista de Deseados) */}
            <View style={styles.wishlistCardSection}>
              <View style={styles.wishlistCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons
                    name={inWishlist ? 'heart' : 'heart-outline'}
                    size={20}
                    color={inWishlist ? '#EF4444' : '#94A3B8'}
                  />
                  <Text style={styles.wishlistCardTitle}>Lista de Deseos</Text>
                </View>
                <TouchableOpacity
                  onPress={handleToggleWishlist}
                  style={[
                    styles.wishlistToggleBtn,
                    inWishlist && styles.wishlistToggleBtnActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.wishlistToggleBtnText,
                      inWishlist && styles.wishlistToggleBtnTextActive,
                    ]}
                  >
                    {inWishlist ? 'En Deseos ✓' : '+ Añadir'}
                  </Text>
                </TouchableOpacity>
              </View>

              {inWishlist && wishlistItem && (
                <View style={styles.wishlistDetailsBox}>
                  {/* Selector de Prioridad */}
                  <View style={styles.wishlistSettingRow}>
                    <Text style={styles.wishlistSettingLabel}>Prioridad:</Text>
                    <View style={styles.priorityRow}>
                      {(['alta', 'media', 'baja'] as const).map(p => {
                        const isSelected = wishlistItem.priority === p;
                        return (
                          <TouchableOpacity
                            key={p}
                            style={[
                              styles.priorityChip,
                              isSelected && styles.priorityChipSelected,
                              isSelected && p === 'alta' && { backgroundColor: 'rgba(239, 68, 68, 0.25)', borderColor: '#EF4444' },
                              isSelected && p === 'media' && { backgroundColor: 'rgba(59, 130, 246, 0.25)', borderColor: '#3B82F6' },
                              isSelected && p === 'baja' && { backgroundColor: 'rgba(100, 116, 139, 0.25)', borderColor: '#64748B' },
                            ]}
                            onPress={() => updateWishlistItem(wishlistItem.id, { priority: p })}
                          >
                            <Text
                              style={[
                                styles.priorityChipText,
                                isSelected && { color: p === 'alta' ? '#FCA5A5' : p === 'media' ? '#93C5FD' : '#CBD5E1', fontWeight: '700' },
                              ]}
                            >
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Cantidad deseada */}
                  <View style={[styles.wishlistSettingRow, { marginTop: 8 }]}>
                    <Text style={styles.wishlistSettingLabel}>Copias que buscas:</Text>
                    <View style={styles.counterWrapper}>
                      <TouchableOpacity
                        onPress={() =>
                          updateWishlistItem(wishlistItem.id, {
                            targetQuantity: Math.max(1, (wishlistItem.targetQuantity || 1) - 1),
                          })
                        }
                        style={[
                          styles.countButton,
                          wishlistItem.targetQuantity <= 1 && styles.countButtonDisabled,
                        ]}
                        disabled={wishlistItem.targetQuantity <= 1}
                      >
                        <Text style={styles.countButtonText}>−</Text>
                      </TouchableOpacity>
                      <View style={styles.countBadge}>
                        <Text style={styles.countNumber}>{wishlistItem.targetQuantity || 1}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          updateWishlistItem(wishlistItem.id, {
                            targetQuantity: (wishlistItem.targetQuantity || 1) + 1,
                          })
                        }
                        style={styles.countButton}
                      >
                        <Text style={styles.countButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Estadísticas de Ataque y Vida si aplica */}
            {(card.power !== undefined || card.health !== undefined) && (
              <View style={styles.combatStatsBox}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t.powerLabel}</Text>
                  <Text style={styles.statValue}>{card.power ?? 0}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t.healthLabel}</Text>
                  <Text style={styles.statValue}>{card.health ?? 0}</Text>
                </View>
              </View>
            )}

            {/* Texto de Habilidades / Reglas oficiales */}
            {Boolean(card.rulesText) && (
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>{t.rulesTitle}</Text>
                <Text style={styles.rulesText}>{card.rulesText}</Text>
              </View>
            )}

            {/* Ambientación / Flavor Text */}
            {Boolean(card.flavorText) && (
              <View style={styles.flavorBox}>
                <Text style={styles.flavorText}>{card.flavorText}</Text>
              </View>
            )}

            {/* Precios de mercado */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceHeader}>{t.pricesTitle}</Text>
              <View style={styles.priceGrid}>
                <View style={styles.priceCard}>
                  <Text style={styles.priceType}>{t.marketPrice}</Text>
                  <Text style={styles.priceAmount}>
                    {card.prices?.market != null ? `$${card.prices.market.toFixed(2)}` : 'N/D'}
                  </Text>
                </View>

                <View style={styles.priceCard}>
                  <Text style={styles.priceType}>{t.usdPrice}</Text>
                  <Text style={styles.priceAmount}>
                    {card.prices?.usd != null ? `$${card.prices.usd.toFixed(2)}` : 'N/D'}
                  </Text>
                </View>

                <View style={styles.priceCard}>
                  <Text style={styles.priceType}>{t.foilPrice}</Text>
                  <Text style={styles.priceAmountFoil}>
                    {card.prices?.foil != null ? `$${card.prices.foil.toFixed(2)}` : 'N/D'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botón de cierre inferior */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={styles.closeActionButton}
            >
              <Text style={styles.closeActionButtonText}>{t.closeModal}</Text>
            </TouchableOpacity>
          </ScrollView>
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
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '92%',
    maxWidth: 520,
    backgroundColor: TCG_THEME.colors.backgroundElevated,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: TCG_THEME.colors.borderHighlight,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: TCG_THEME.colors.cyan,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  closeIconButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(21, 27, 38, 0.95)',
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  wishlistIconButton: {
    position: 'absolute',
    top: 14,
    right: 52,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(21, 27, 38, 0.95)',
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  wishlistIconButtonActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  wishlistCardSection: {
    backgroundColor: '#0A121A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12,
    gap: 8,
  },
  wishlistCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wishlistCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  wishlistToggleBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  wishlistToggleBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  wishlistToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCA5A5',
  },
  wishlistToggleBtnTextActive: {
    color: '#FFFFFF',
  },
  wishlistDetailsBox: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  wishlistSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wishlistSettingLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  priorityChipSelected: {
    borderWidth: 1,
  },
  priorityChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  closeIconText: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    gap: 16,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: TCG_THEME.cardAspectRatio,
    maxHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#070A0F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
  },
  cardName: {
    color: TCG_THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardSubtype: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  energyOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#071A1E',
    borderWidth: 2,
    borderColor: TCG_THEME.colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TCG_THEME.colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  energyOrbNumber: {
    color: TCG_THEME.colors.cyan,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  energyOrbLabel: {
    color: TCG_THEME.colors.cyan,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  /* Sección de Deck Builder */
  deckSection: {
    backgroundColor: '#0A121A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: TCG_THEME.colors.cyan,
    padding: 14,
    gap: 10,
  },
  deckSectionTitle: {
    color: TCG_THEME.colors.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  deckTag: {
    backgroundColor: 'rgba(10, 200, 185, 0.15)',
    borderWidth: 1,
    borderColor: TCG_THEME.colors.cyan,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deckTagText: {
    color: TCG_THEME.colors.cyan,
    fontSize: 10,
    fontWeight: '800',
  },
  deckMiniChipSelected: {
    borderColor: TCG_THEME.colors.cyan,
    backgroundColor: 'rgba(10, 200, 185, 0.15)',
  },
  deckMiniTextSelected: {
    color: TCG_THEME.colors.cyan,
    fontWeight: '800',
  },
  deckControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: TCG_THEME.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    marginTop: 4,
  },
  deckControlsPrompt: {
    color: TCG_THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  noDecksNotice: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  /* Sección de Gestión de Carpetas */
  vaultSection: {
    backgroundColor: '#0E131C',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: TCG_THEME.colors.goldDark,
    padding: 14,
    gap: 12,
  },
  vaultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vaultSectionTitle: {
    color: TCG_THEME.colors.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  vaultOwnedTag: {
    backgroundColor: 'rgba(200, 170, 110, 0.15)',
    borderWidth: 1,
    borderColor: TCG_THEME.colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vaultOwnedTagText: {
    color: TCG_THEME.colors.gold,
    fontSize: 10,
    fontWeight: '800',
  },
  folderSelectWrapper: {
    gap: 6,
  },
  folderSelectLabel: {
    color: TCG_THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  folderChipsScroll: {
    gap: 6,
  },
  folderMiniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TCG_THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  folderMiniChipSelected: {
    borderColor: TCG_THEME.colors.gold,
    backgroundColor: 'rgba(200, 170, 110, 0.15)',
  },
  folderMiniIcon: {
    fontSize: 12,
  },
  folderMiniText: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  folderMiniTextSelected: {
    color: TCG_THEME.colors.gold,
    fontWeight: '800',
  },
  copyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: TCG_THEME.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
  },
  copyLabelCol: {
    flex: 1,
  },
  copyLabelTitle: {
    color: TCG_THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  copyLabelTitleFoil: {
    color: TCG_THEME.colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  copyLabelSub: {
    color: TCG_THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TCG_THEME.colors.cardHighlight,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButtonFoil: {
    borderColor: TCG_THEME.colors.gold,
  },
  countButtonDisabled: {
    opacity: 0.3,
    borderColor: TCG_THEME.colors.border,
  },
  countButtonText: {
    color: TCG_THEME.colors.cyan,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#071A1E',
    borderWidth: 1,
    borderColor: TCG_THEME.colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeFoil: {
    backgroundColor: '#1E190E',
    borderColor: TCG_THEME.colors.gold,
  },
  countNumber: {
    color: TCG_THEME.colors.cyan,
    fontSize: 14,
    fontWeight: '900',
  },
  countNumberFoil: {
    color: TCG_THEME.colors.gold,
    fontSize: 14,
    fontWeight: '900',
  },
  myValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(38, 48, 66, 0.5)',
  },
  myValueLabel: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  myValueAmount: {
    color: TCG_THEME.colors.gold,
    fontSize: 11,
    fontWeight: '800',
  },
  combatStatsBox: {
    flexDirection: 'row',
    backgroundColor: TCG_THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.goldDark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: TCG_THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    color: TCG_THEME.colors.gold,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: TCG_THEME.colors.border,
  },
  sectionBox: {
    backgroundColor: TCG_THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    color: TCG_THEME.colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rulesText: {
    color: TCG_THEME.colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  flavorBox: {
    borderLeftWidth: 3,
    borderLeftColor: TCG_THEME.colors.goldDark,
    paddingLeft: 12,
    paddingVertical: 4,
  },
  flavorText: {
    color: TCG_THEME.colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  priceContainer: {
    backgroundColor: TCG_THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
    padding: 12,
    gap: 8,
  },
  priceHeader: {
    color: TCG_THEME.colors.cyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priceCard: {
    flex: 1,
    backgroundColor: TCG_THEME.colors.backgroundElevated,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TCG_THEME.colors.border,
  },
  priceType: {
    color: TCG_THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  priceAmount: {
    color: TCG_THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  priceAmountFoil: {
    color: TCG_THEME.colors.gold,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  closeActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: TCG_THEME.colors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  closeActionButtonText: {
    color: TCG_THEME.colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
