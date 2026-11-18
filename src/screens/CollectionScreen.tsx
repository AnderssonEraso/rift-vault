import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCollection } from '@/context/CollectionContext';
import { useWishlist } from '@/context/WishlistContext';
import { CreateFolderModal } from '@/components/collection/CreateFolderModal';
import { CardItem } from '@/components/cards/CardItem';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { ScannerScreen } from '@/screens/ScannerScreen';
import { RiftCard } from '@/types/card';
import { WishlistItem, WishlistPriority } from '@/types/wishlist';

export const CollectionScreen: React.FC = () => {
  const {
    folders,
    activeFolderId,
    setActiveFolderId,
    currentFolderItems,
    createFolder,
    stats,
  } = useCollection();

  const [activeTab, setActiveTab] = useState<'folders' | 'wishlist'>('folders');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<RiftCard | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Wishlist
  const {
    items: wishlistItems,
    stats: wishlistStats,
    removeFromWishlist,
    updateWishlistItem,
    moveToCollection,
  } = useWishlist();

  const [wishlistPriorityFilter, setWishlistPriorityFilter] = useState<'all' | 'deals' | WishlistPriority>('all');

  const filteredWishlistItems = useMemo(() => {
    if (wishlistPriorityFilter === 'all') return wishlistItems;
    if (wishlistPriorityFilter === 'deals') {
      return wishlistItems.filter(item => {
        const currentPrice = item.card?.marketPriceUsd || item.card?.prices?.usd || 0;
        return (
          item.targetPrice !== null &&
          item.targetPrice !== undefined &&
          item.targetPrice > 0 &&
          currentPrice > 0 &&
          currentPrice <= item.targetPrice
        );
      });
    }
    return wishlistItems.filter(item => item.priority === wishlistPriorityFilter);
  }, [wishlistItems, wishlistPriorityFilter]);

  const handleGotIt = (item: WishlistItem) => {
    Alert.alert(
      '¡Carta Conseguida!',
      `¿Deseas mover ${item.targetQuantity}x "${item.card?.name}" a tu colección física? Se retirará de tu Lista de Deseos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mover a Colección',
          style: 'default',
          onPress: async () => {
            await moveToCollection(item.cardId);
            Alert.alert('¡Añadida!', `"${item.card?.name}" se ha añadido a tu colección física.`);
          },
        },
      ]
    );
  };

  const handleRemoveWishlist = (cardId: string, cardName: string) => {
    Alert.alert(
      'Eliminar de Deseos',
      `¿Deseas quitar "${cardName}" de tu lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removeFromWishlist(cardId),
        },
      ]
    );
  };

  // Colores temáticos para carpetas según Screenshot 1
  const getFolderBoxColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('vi')) return { bg: 'rgba(239, 68, 68, 0.15)', icon: '#EF4444' };
    if (n.includes('zed')) return { bg: 'rgba(168, 85, 247, 0.15)', icon: '#A855F7' };
    return { bg: 'rgba(59, 130, 246, 0.15)', icon: '#3B82F6' };
  };

  // Si se entra dentro de una carpeta concreta
  const activeFolder = folders.find(f => f.id === activeFolderId);
  const isInsideFolder = activeFolderId !== 'all';

  if (isScannerOpen) {
    return (
      <ScannerScreen
        onBack={() => setIsScannerOpen(false)}
        initialFolderId={isInsideFolder ? activeFolderId : undefined}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Fiel a Screenshot 1 */}
      <View style={styles.header}>
        {isInsideFolder ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setActiveFolderId('all')}
          >
            <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
            <Text style={styles.backBtnText}>Carpetas</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.headerTitle}>Mi colección</Text>
        )}

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}
            onPress={() => setIsScannerOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={20} color="#38BDF8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="arrow-down-outline" size={20} color="#CBD5E1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>

      {!isInsideFolder && (
        <>
          {/* Banner Runes Premium Fiel a Screenshot 1 */}
          <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.85}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="sparkles" size={20} color="#60A5FA" />
            </View>
            <View style={styles.bannerTextBox}>
              <Text style={styles.bannerTitle}>Mejora tu experiencia</Text>
              <Text style={styles.bannerSubtitle}>con Runes Premium</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#93C5FD" />
          </TouchableOpacity>

          {/* Sub-tabs: Carpetas | Deseos Fiel a Screenshot 1 */}
          <View style={styles.subTabsContainer}>
            <TouchableOpacity
              style={[styles.subTabBtn, activeTab === 'folders' && styles.subTabBtnActive]}
              onPress={() => setActiveTab('folders')}
            >
              <Text
                style={[
                  styles.subTabText,
                  activeTab === 'folders' && styles.subTabTextActive,
                ]}
              >
                Carpetas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTabBtn, activeTab === 'wishlist' && styles.subTabBtnActive]}
              onPress={() => setActiveTab('wishlist')}
            >
              <Text
                style={[
                  styles.subTabText,
                  activeTab === 'wishlist' && styles.subTabTextActive,
                ]}
              >
                Deseos
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Contenido de Carpetas Fiel a Screenshot 1 */}
      {activeTab === 'folders' && !isInsideFolder ? (
        <ScrollView contentContainerStyle={styles.foldersList} showsVerticalScrollIndicator={false}>
          {folders.map(folder => {
            const colors = getFolderBoxColor(folder.name);
            return (
              <TouchableOpacity
                key={folder.id}
                style={styles.folderCard}
                onPress={() => setActiveFolderId(folder.id)}
                activeOpacity={0.8}
              >
                {/* Caja de color Fiel a Screenshot 1 */}
                <View style={[styles.folderIconBox, { backgroundColor: colors.bg }]}>
                  <Ionicons name="cube-outline" size={32} color={colors.icon} />
                </View>

                <View style={styles.folderDetails}>
                  <Text style={styles.folderName}>{folder.name}</Text>
                  {folder.description ? (
                    <Text style={styles.folderDesc} numberOfLines={1}>
                      {folder.description}
                    </Text>
                  ) : null}

                  {/* Badge de Privada Fiel a Screenshot 1 */}
                  <View style={styles.privateBadge}>
                    <Ionicons name="eye-outline" size={11} color="#94A3B8" style={{ marginRight: 4 }} />
                    <Text style={styles.privateText}>Privada</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : isInsideFolder ? (
        /* VISTA DENTRO DE UNA CARPETA SELECCIONADA */
        <View style={styles.insideFolderContainer}>
          <View style={styles.folderHeaderInfo}>
            <Text style={styles.insideFolderName}>{activeFolder?.name}</Text>
            <Text style={styles.insideFolderStats}>
              {currentFolderItems.length} cartas • Valor est. ${currentFolderItems.reduce((acc, c) => acc + (c.card.marketPriceUsd || c.card.prices?.usd || 0.1) * (c.count ?? (c.regularCount + c.foilCount)), 0).toFixed(2)}
            </Text>
          </View>

          {currentFolderItems.length === 0 ? (
            <View style={styles.emptyFolderBox}>
              <Ionicons name="file-tray-outline" size={48} color="#475569" />
              <Text style={styles.emptyFolderText}>No hay cartas en esta carpeta aún.</Text>
            </View>
          ) : (
            <FlatList
              data={currentFolderItems}
              numColumns={2}
              keyExtractor={item => item.cardId}
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 80 }}
              renderItem={({ item }) => {
                const totalCopies = item.count ?? (item.regularCount + item.foilCount);
                return (
                  <View style={styles.folderCardWrapper}>
                    <CardItem card={item.card} onPress={c => setSelectedCard(c)} />
                    <View style={styles.folderCardCountBadge}>
                      <Text style={styles.folderCardCountText}>x{totalCopies}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      ) : (
        /* TAB DE DESEOS / WISHLIST */
        <View style={styles.wishlistMainContainer}>
          {/* Tarjeta de Resumen de Wishlist */}
          <View style={styles.wishlistSummaryCard}>
            <View style={styles.wishlistSummaryCol}>
              <Text style={styles.wishlistSummaryLabel}>Presupuesto Total</Text>
              <Text style={styles.wishlistSummaryValue}>
                ${wishlistStats.estimatedTotalUsd.toFixed(2)} <Text style={styles.currencySub}>USD</Text>
              </Text>
            </View>
            <View style={styles.wishlistSummaryDivider} />
            <View style={styles.wishlistSummaryCol}>
              <Text style={styles.wishlistSummaryLabel}>Cartas Deseadas</Text>
              <Text style={styles.wishlistSummaryValue}>
                {wishlistStats.totalCardsCount}{' '}
                <Text style={styles.currencySub}>({wishlistStats.totalItems})</Text>
              </Text>
            </View>
            {wishlistStats.dealsCount > 0 && (
              <>
                <View style={styles.wishlistSummaryDivider} />
                <View style={styles.wishlistSummaryCol}>
                  <Text style={[styles.wishlistSummaryLabel, { color: '#10B981' }]}>
                    En Oferta
                  </Text>
                  <Text style={[styles.wishlistSummaryValue, { color: '#10B981' }]}>
                    🔥 {wishlistStats.dealsCount}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Filtros de Prioridad */}
          <View style={{ height: 42 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.wishlistFiltersScroll}
              contentContainerStyle={styles.wishlistFiltersContent}
            >
              <TouchableOpacity
                style={[
                  styles.wishlistFilterPill,
                  wishlistPriorityFilter === 'all' && styles.wishlistFilterPillActive,
                ]}
                onPress={() => setWishlistPriorityFilter('all')}
              >
                <Text
                  style={[
                    styles.wishlistFilterPillText,
                    wishlistPriorityFilter === 'all' && styles.wishlistFilterPillTextActive,
                  ]}
                >
                  Todas ({wishlistItems.length})
                </Text>
              </TouchableOpacity>

              {wishlistStats.dealsCount > 0 && (
                <TouchableOpacity
                  style={[
                    styles.wishlistFilterPill,
                    styles.wishlistDealPill,
                    wishlistPriorityFilter === 'deals' && styles.wishlistDealPillActive,
                  ]}
                  onPress={() => setWishlistPriorityFilter('deals')}
                >
                  <Text
                    style={[
                      styles.wishlistFilterPillText,
                      { color: '#10B981' },
                      wishlistPriorityFilter === 'deals' && { color: '#FFFFFF', fontWeight: '700' },
                    ]}
                  >
                    🔥 En Oferta ({wishlistStats.dealsCount})
                  </Text>
                </TouchableOpacity>
              )}

              {(['alta', 'media', 'baja'] as const).map(p => {
                const count = wishlistItems.filter(i => i.priority === p).length;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.wishlistFilterPill,
                      wishlistPriorityFilter === p && styles.wishlistFilterPillActive,
                    ]}
                    onPress={() => setWishlistPriorityFilter(p)}
                  >
                    <Text
                      style={[
                        styles.wishlistFilterPillText,
                        wishlistPriorityFilter === p && styles.wishlistFilterPillTextActive,
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Lista de Cartas de Wishlist */}
          {filteredWishlistItems.length === 0 ? (
            <View style={styles.wishlistEmptyBox}>
              <Ionicons name="heart-dislike-outline" size={48} color="#475569" />
              <Text style={styles.wishlistEmptyTitle}>
                {wishlistItems.length === 0
                  ? 'Tu lista de deseos está vacía'
                  : 'No hay cartas con este filtro'}
              </Text>
              <Text style={styles.wishlistEmptyDesc}>
                {wishlistItems.length === 0
                  ? 'Añade cartas tocando el corazón en el detalle de una carta o desde el análisis de mazo.'
                  : 'Cambia el filtro de prioridad para ver tus cartas guardadas.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredWishlistItems}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 10 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const currentPrice =
                  item.card?.marketPriceUsd || item.card?.prices?.usd || 0;
                const isDeal =
                  item.targetPrice !== null &&
                  item.targetPrice !== undefined &&
                  item.targetPrice > 0 &&
                  currentPrice > 0 &&
                  currentPrice <= item.targetPrice;

                return (
                  <View style={styles.wishlistCardRow}>
                    <TouchableOpacity
                      onPress={() => setSelectedCard(item.card)}
                      activeOpacity={0.8}
                    >
                      {item.card?.imageUrl || item.card?.thumbnailUrl ? (
                        <Image
                          source={{ uri: item.card?.thumbnailUrl || item.card?.imageUrl }}
                          style={styles.wishlistCardThumb}
                        />
                      ) : (
                        <View style={styles.wishlistCardThumbPlaceholder}>
                          <Ionicons name="image-outline" size={20} color="#64748B" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <View style={styles.wishlistCardBody}>
                      <View style={styles.wishlistCardTopRow}>
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => setSelectedCard(item.card)}
                        >
                          <Text style={styles.wishlistCardName} numberOfLines={1}>
                            {item.card?.name || 'Carta'}
                          </Text>
                          <Text style={styles.wishlistCardMeta}>
                            {item.card?.primaryDomain || 'Rift'} • {item.isFoil ? '★ Foil' : 'Normal'}
                          </Text>
                        </TouchableOpacity>

                        {/* Badge de Prioridad */}
                        <View
                          style={[
                            styles.wishlistPriorityBadge,
                            item.priority === 'alta' && styles.priorityBadgeAlta,
                            item.priority === 'media' && styles.priorityBadgeMedia,
                            item.priority === 'baja' && styles.priorityBadgeBaja,
                          ]}
                        >
                          <Text
                            style={[
                              styles.wishlistPriorityBadgeText,
                              item.priority === 'alta' && { color: '#EF4444' },
                              item.priority === 'media' && { color: '#3B82F6' },
                              item.priority === 'baja' && { color: '#94A3B8' },
                            ]}
                          >
                            {item.priority.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Precios y Ofertas */}
                      <View style={styles.wishlistPriceRow}>
                        <View>
                          <Text style={styles.wishlistMarketPrice}>
                            ${currentPrice > 0 ? currentPrice.toFixed(2) : '—'} USD
                          </Text>
                          {item.targetPrice ? (
                            <Text style={styles.wishlistTargetPriceText}>
                              Meta: ${item.targetPrice.toFixed(2)} USD
                            </Text>
                          ) : null}
                        </View>

                        {isDeal && (
                          <View style={styles.dealBadge}>
                            <Ionicons name="flame" size={12} color="#10B981" />
                            <Text style={styles.dealBadgeText}>¡En precio!</Text>
                          </View>
                        )}
                      </View>

                      {/* Barra de Acciones */}
                      <View style={styles.wishlistActionsRow}>
                        {/* Selector de copias */}
                        <View style={styles.wishlistCounterMini}>
                          <TouchableOpacity
                            style={styles.counterMiniBtn}
                            onPress={() =>
                              updateWishlistItem(item.id, {
                                targetQuantity: Math.max(1, item.targetQuantity - 1),
                              })
                            }
                            disabled={item.targetQuantity <= 1}
                          >
                            <Text style={styles.counterMiniBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.counterMiniVal}>{item.targetQuantity}</Text>
                          <TouchableOpacity
                            style={styles.counterMiniBtn}
                            onPress={() =>
                              updateWishlistItem(item.id, {
                                targetQuantity: item.targetQuantity + 1,
                              })
                            }
                          >
                            <Text style={styles.counterMiniBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Botón ¡Ya la conseguí! */}
                        <TouchableOpacity
                          style={styles.gotItBtn}
                          onPress={() => handleGotIt(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                          <Text style={styles.gotItBtnText}>¡Ya la conseguí!</Text>
                        </TouchableOpacity>

                        {/* Eliminar */}
                        <TouchableOpacity
                          style={styles.removeWishlistBtn}
                          onPress={() => handleRemoveWishlist(item.cardId, item.card.name)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={16} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Floating Action Button '+' Fiel a Screenshot 1 */}
      {!isInsideFolder && activeTab === 'folders' && (
        <TouchableOpacity
          style={styles.floatingAddBtn}
          onPress={() => setIsCreateModalOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Modal para Crear Carpeta */}
      <CreateFolderModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={async data => {
          await createFolder(data);
          setIsCreateModalOpen(false);
        }}
      />

      {/* Modal de Detalle de Carta */}
      <CardDetailModal
        card={selectedCard}
        visible={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D14',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    marginLeft: 14,
    padding: 6,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#172554',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#93C5FD',
    marginTop: 1,
  },
  subTabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  subTabBtn: {
    paddingVertical: 10,
    marginRight: 28,
  },
  subTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  subTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  foldersList: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1522',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  folderIconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  folderDetails: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  folderDesc: {
    fontSize: 12,
    color: '#8E9AA8',
    marginBottom: 6,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161F30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#26334D',
  },
  privateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  insideFolderContainer: {
    flex: 1,
  },
  folderHeaderInfo: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  insideFolderName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  insideFolderStats: {
    fontSize: 13,
    color: '#8E9AA8',
    marginTop: 2,
  },
  folderCardWrapper: {
    flex: 1,
    margin: 4,
    position: 'relative',
  },
  folderCardCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  folderCardCountText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  emptyFolderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyFolderText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 12,
  },
  /* ESTILOS DE WISHLIST */
  wishlistMainContainer: {
    flex: 1,
  },
  wishlistSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  wishlistSummaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  wishlistSummaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  wishlistSummaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  currencySub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  wishlistSummaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1E293B',
  },
  wishlistFiltersScroll: {
    marginHorizontal: 16,
  },
  wishlistFiltersContent: {
    gap: 8,
    alignItems: 'center',
  },
  wishlistFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  wishlistFilterPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  wishlistFilterPillText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  wishlistFilterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  wishlistDealPill: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  wishlistDealPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  wishlistEmptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 40,
  },
  wishlistEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  wishlistEmptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  wishlistCardRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  wishlistCardThumb: {
    width: 44,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  wishlistCardThumbPlaceholder: {
    width: 44,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistCardBody: {
    flex: 1,
    marginLeft: 12,
  },
  wishlistCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wishlistCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  wishlistCardMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  wishlistPriorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityBadgeAlta: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  priorityBadgeMedia: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  priorityBadgeBaja: {
    borderColor: '#64748B',
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  wishlistPriorityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wishlistPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  wishlistMarketPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  wishlistTargetPriceText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  dealBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  wishlistActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  wishlistCounterMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D14',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  counterMiniBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterMiniBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  counterMiniVal: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  gotItBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 4,
  },
  gotItBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  removeWishlistBtn: {
    padding: 4,
  },
  floatingAddBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
});
