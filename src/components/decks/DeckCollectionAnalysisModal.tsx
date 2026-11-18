import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Deck } from '@/types/deck';
import { DeckCollectionAnalysis } from '@/utils/deckCollectionAnalysis';
import { useCollection } from '@/context/CollectionContext';
import { useWishlist } from '@/context/WishlistContext';
import { ProxyGeneratorModal } from '@/components/decks/ProxyGeneratorModal';

interface DeckCollectionAnalysisModalProps {
  visible: boolean;
  deck: Deck;
  analysis: DeckCollectionAnalysis;
  onClose: () => void;
}

export const DeckCollectionAnalysisModal: React.FC<DeckCollectionAnalysisModalProps> = ({
  visible,
  deck,
  analysis,
  onClose,
}) => {
  const { quickAddCard } = useCollection();
  const { addMissingCardsToWishlist } = useWishlist();
  const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);
  const [isAddingWishlist, setIsAddingWishlist] = useState(false);

  const handleAddMissingToWishlist = async () => {
    if (analysis.missingCards.length === 0) return;
    setIsAddingWishlist(true);
    try {
      const count = await addMissingCardsToWishlist(analysis.missingCards, 'alta');
      Alert.alert(
        '¡Añadidas a tu Wishlist!',
        `Se añadieron ${count} cartas faltantes con prioridad Alta a tu Lista de Deseos.`
      );
    } catch {
      Alert.alert('Error', 'No se pudieron añadir las cartas a la Wishlist.');
    } finally {
      setIsAddingWishlist(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: `${deck.color || '#3B82F6'}22` },
              ]}
            >
              <Ionicons
                name="cube-outline"
                size={24}
                color={deck.color || '#3B82F6'}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>¿Puedo armarlo en físico?</Text>
              <Text style={styles.subtitle}>{deck.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Tarjeta de Resumen de Disponibilidad */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.percentageLabel}>Completitud en físico</Text>
                <Text
                  style={[
                    styles.percentageValue,
                    {
                      color:
                        analysis.isFullyOwned
                          ? '#10B981'
                          : analysis.completionPercentage >= 75
                          ? '#F59E0B'
                          : '#EF4444',
                    },
                  ]}
                >
                  {analysis.completionPercentage}%
                </Text>
              </View>

              <View style={styles.statsRight}>
                <View style={styles.statItem}>
                  <Text style={styles.statItemLabel}>Cartas en posesión</Text>
                  <Text style={styles.statItemVal}>
                    {analysis.totalOwnedCards} / {analysis.totalRequiredCards}
                  </Text>
                </View>
                {!analysis.isFullyOwned && (
                  <View style={styles.statItem}>
                    <Text style={styles.statItemLabel}>Presupuesto faltante</Text>
                    <Text style={styles.missingCostVal}>
                      ${analysis.estimatedMissingCostUsd.toFixed(2)} USD
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Barra de progreso visual */}
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${analysis.completionPercentage}%`,
                    backgroundColor:
                      analysis.isFullyOwned
                        ? '#10B981'
                        : analysis.completionPercentage >= 75
                        ? '#F59E0B'
                        : '#EF4444',
                  },
                ]}
              />
            </View>
          </View>

          {/* Mensaje de estado */}
          {analysis.isFullyOwned ? (
            <View style={styles.fullyOwnedBanner}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.fullyOwnedTitle}>¡Mazo 100% completo!</Text>
                <Text style={styles.fullyOwnedText}>
                  Tienes todas las cartas físicas necesarias registradas en tu colección.
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.sectionHeader}>
              CARTAS FALTANTES ({analysis.missingCards.length})
            </Text>
          )}

          {/* Lista de cartas faltantes */}
          {!analysis.isFullyOwned && (
            <ScrollView style={styles.missingListScroll} showsVerticalScrollIndicator={false}>
              {analysis.missingCards.map(item => (
                <View key={item.cardId} style={styles.missingCardRow}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.cardThumb} />
                  ) : (
                    <View style={styles.cardThumbPlaceholder}>
                      <Ionicons name="image-outline" size={16} color="#64748B" />
                    </View>
                  )}

                  <View style={styles.missingCardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardSectionMeta}>
                      {item.section} • Est. ${(item.estimatedPriceUsd || 0).toFixed(2)} c/u
                    </Text>
                  </View>

                  <View style={styles.missingCounterBadge}>
                    <Text style={styles.missingCounterText}>
                      Faltan {item.missing}
                    </Text>
                    <Text style={styles.ownedSubText}>
                      ({item.owned}/{item.required})
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.quickAddBtn}
                    onPress={() => {
                      quickAddCard({
                        id: item.cardId,
                        name: item.name,
                        domains: [deck.domains[0] || 'fury'],
                        primaryDomain: deck.domains[0] || 'fury',
                        imageUrl: item.imageUrl,
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={16} color="#3B82F6" />
                    <Text style={styles.quickAddText}>+1</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Botones de acción inferior */}
          <View style={styles.footerActions}>
            {!analysis.isFullyOwned && (
              <TouchableOpacity
                style={styles.wishlistBatchBtn}
                onPress={handleAddMissingToWishlist}
                disabled={isAddingWishlist}
                activeOpacity={0.85}
              >
                <Ionicons name="heart-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.wishlistBatchText}>
                  {isAddingWishlist
                    ? 'Añadiendo a Deseos...'
                    : `Añadir faltantes a Wishlist (${analysis.missingCards.length})`}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.proxyFooterBtn}
              onPress={() => setIsProxyModalOpen(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="print-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.proxyFooterText}>
                {analysis.isFullyOwned ? 'Generar Proxies del Mazo' : `Generar Proxies Faltantes (${analysis.totalMissingCards})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.closeFooterBtn}>
              <Text style={styles.closeFooterText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal Generador de Proxies */}
      {isProxyModalOpen && (
        <ProxyGeneratorModal
          visible={isProxyModalOpen}
          deck={deck}
          analysis={analysis}
          initialMode={analysis.isFullyOwned ? 'all' : 'missing'}
          onClose={() => setIsProxyModalOpen(false)}
        />
      )}
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
    maxWidth: 500,
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
  closeIconBtn: {
    padding: 6,
  },
  summaryCard: {
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  percentageLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  percentageValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  statsRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statItem: {
    alignItems: 'flex-end',
  },
  statItemLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  missingCostVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  fullyOwnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
  },
  fullyOwnedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  fullyOwnedText: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  missingListScroll: {
    maxHeight: 220,
    marginBottom: 14,
  },
  missingCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131D31',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardThumb: {
    width: 36,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#090D14',
  },
  cardThumbPlaceholder: {
    width: 36,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#090D14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missingCardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  cardSectionMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  missingCounterBadge: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  missingCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  ownedSubText: {
    fontSize: 10,
    color: '#64748B',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  quickAddText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    marginLeft: 2,
  },
  footerActions: {
    marginTop: 8,
    gap: 8,
  },
  wishlistBatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 10,
  },
  wishlistBatchText: {
    color: '#FCA5A5',
    fontWeight: '700',
    fontSize: 13,
  },
  proxyFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 11,
  },
  proxyFooterText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  closeFooterBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeFooterText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
