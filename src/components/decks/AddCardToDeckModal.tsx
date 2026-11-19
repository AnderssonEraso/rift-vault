import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Deck } from '@/types/deck';
import { RiftCard, CardDomain, CardType } from '@/types/card';
import { fetchCards, getCardImageUrl } from '@/services/openRiftApi';
import { useDecks } from '@/context/DeckContext';
import { useCollection } from '@/context/CollectionContext';
import { calculateDeckStats } from '@/utils/deckValidation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COL_WIDTH = Math.floor((SCREEN_WIDTH - 32 - 16) / 3);
const GRID_COL_HEIGHT = Math.floor(GRID_COL_WIDTH * 1.4);

interface AddCardToDeckModalProps {
  visible: boolean;
  deck: Deck;
  initialType?: string;
  onClose: () => void;
}

const TYPE_FILTERS: { key: string; label: string; icon: string }[] = [
  { key: 'All', label: 'Todos', icon: 'apps-outline' },
  { key: 'Unit', label: 'Unidades', icon: 'person-outline' },
  { key: 'Spell', label: 'Hechizos', icon: 'flash-outline' },
  { key: 'Gear', label: 'Gear', icon: 'shield-outline' },
  { key: 'Battlefield', label: 'Campos', icon: 'map-outline' },
  { key: 'Legend', label: 'Leyendas', icon: 'trophy-outline' },
];

const DOMAIN_FILTERS: { key: string; label: string; color: string }[] = [
  { key: 'All', label: 'Todos', color: '#94A3B8' },
  { key: 'Fury', label: 'Fury', color: '#EF4444' },
  { key: 'Calm', label: 'Calm', color: '#0AC8B9' },
  { key: 'Mind', label: 'Mind', color: '#3B82F6' },
  { key: 'Body', label: 'Body', color: '#10B981' },
  { key: 'Chaos', label: 'Chaos', color: '#A855F7' },
  { key: 'Order', label: 'Order', color: '#EAB308' },
];

export const AddCardToDeckModal: React.FC<AddCardToDeckModalProps> = ({
  visible,
  deck,
  initialType = 'All',
  onClose,
}) => {
  const { decks, setCardCountInDeck, updateDeck } = useDecks();
  const { allCollectionItems, getCardOwnership } = useCollection();

  // Obtener la versión más fresca del mazo desde el context
  const currentDeck = useMemo(() => {
    return decks.find(d => d.id === deck.id) || deck;
  }, [decks, deck]);

  const stats = useMemo(() => calculateDeckStats(currentDeck), [currentDeck]);

  const [cards, setCards] = useState<RiftCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [onlyCollection, setOnlyCollection] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Modo Leyenda o Unidad Campeón exclusivo
  const isLegendOnlyMode = initialType === 'Legend';
  const isChampUnitMode = initialType === 'ChampUnit';
  const isFilteringLegend = isLegendOnlyMode || selectedType === 'Legend';

  // Nombre base del campeón según la leyenda elegida (ej. "Jinx", "Zed", "Kai'Sa", "Ahri")
  const championBaseName = useMemo(() => {
    if (!currentDeck.legendCard?.name) return '';
    return currentDeck.legendCard.name.split(',')[0].trim();
  }, [currentDeck.legendCard]);

  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  // Carga de catálogo de OpenRift
  const loadCards = useCallback(async (isFresh = false) => {
    try {
      if (isFresh) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      let activeType: CardType = selectedType as CardType;
      let queryParam = searchQuery;

      if (isLegendOnlyMode) {
        activeType = 'Legend';
      } else if (isChampUnitMode) {
        activeType = 'Unit';
        // Buscamos específicamente el nombre del campeón en OpenRift
        queryParam = searchQuery ? `${championBaseName} ${searchQuery}`.trim() : championBaseName;
      }

      const res = await fetchCards({
        query: queryParam,
        domain: (selectedDomain as CardDomain),
        type: activeType,
        cursor: isFresh ? null : nextCursor,
        limit: 24,
      });

      if (isFresh) {
        setCards(res.cards || []);
      } else {
        setCards(prev => [...prev, ...(res.cards || [])]);
      }
      setNextCursor(res.nextCursor);
    } catch (e) {
      console.warn('Error al cargar cartas para el mazo:', e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, selectedDomain, selectedType, isLegendOnlyMode, isChampUnitMode, championBaseName, nextCursor]);

  // Recargar cuando cambian los filtros
  useEffect(() => {
    if (visible) {
      loadCards(true);
    }
  }, [visible, searchQuery, selectedDomain, selectedType, isLegendOnlyMode, isChampUnitMode]);

  // Obtener copias de esta carta en el mazo actual
  const getCardCountInCurrentDeck = useCallback((card: RiftCard): number => {
    if (currentDeck.legendCard?.id === card.id) return 1;

    const allSlots = [
      ...(currentDeck.mainUnits || []),
      ...(currentDeck.mainGear || []),
      ...(currentDeck.mainSpells || []),
      ...(currentDeck.battlefields || []),
      ...(currentDeck.sideboard || []),
      ...(currentDeck.maybeboard || []),
    ];

    const slot = allSlots.find(s => s.cardId === card.id);
    return slot ? slot.count : 0;
  }, [currentDeck]);

  // Asignar Leyenda: Asigna al mazo y CIERRA automáticamente el modal
  const handleSelectLegend = (card: RiftCard) => {
    triggerHaptic();

    // Dominios oficiales de la leyenda
    const cardDomains = (card.domains && card.domains.length > 0)
      ? card.domains
      : [card.primaryDomain || 'Fury'];

    // 12 runas reglamentarias distribuidas según los dominios de la leyenda
    const newRunes = cardDomains.length === 1
      ? [{ id: '1', domain: cardDomains[0].toLowerCase(), count: 12 }]
      : cardDomains.slice(0, 2).map((dom, idx) => ({
          id: String(idx + 1),
          domain: dom.toLowerCase(),
          count: 6,
        }));

    updateDeck(currentDeck.id, {
      legendCard: card,
      domains: cardDomains,
      coverImage: getCardImageUrl(card),
      runes: newRunes,
    });

    // Se cierra inmediatamente la lista como fue solicitado
    onClose();
  };

  // Asignar Unidad Campeón (Champ Unit): Asigna al mazo y CIERRA automáticamente el modal
  const handleSelectChampUnit = (card: RiftCard) => {
    triggerHaptic();

    const existingSlot = (currentDeck.mainUnits || []).find(s => s.cardId === card.id);
    let updatedUnits = currentDeck.mainUnits || [];
    if (!existingSlot) {
      updatedUnits = [
        { cardId: card.id, card, count: 1, isOwned: true },
        ...updatedUnits,
      ];
    }

    updateDeck(currentDeck.id, {
      championUnit: card,
      mainUnits: updatedUnits,
    });

    // Se cierra inmediatamente la lista como fue solicitado
    onClose();
  };

  const handleSetCount = (card: RiftCard, targetCount: number) => {
    triggerHaptic();

    const isLegend = (card.type || card.cardType || '').toLowerCase().includes('legend');
    if (isLegend) {
      if (targetCount > 0) {
        handleSelectLegend(card);
      } else {
        updateDeck(currentDeck.id, { legendCard: undefined });
      }
      return;
    }

    setCardCountInDeck(currentDeck.id, card, targetCount);
  };

  // Filtrado de cartas asegurando que:
  // - En modo Leyenda SOLO aparezcan leyendas
  // - En modo Champ Unit SOLO aparezcan unidades del campeón de la leyenda
  const displayedCards = useMemo(() => {
    let list = cards;
    if (isFilteringLegend) {
      list = list.filter(c => (c.type || c.cardType || '').toLowerCase().includes('legend'));
    } else if (isChampUnitMode && championBaseName) {
      const term = championBaseName.toLowerCase();
      list = list.filter(c => {
        const isUnit = (c.type || c.cardType || '').toLowerCase().includes('unit');
        const matchesName = c.name.toLowerCase().includes(term);
        const matchesSubtype = c.subtypes?.some(s => s.toLowerCase().includes(term));
        return isUnit && (matchesName || matchesSubtype);
      });
    }
    if (onlyCollection) {
      const ownedIds = new Set(allCollectionItems.map(it => it.card.id));
      list = list.filter(c => ownedIds.has(c.id));
    }
    return list;
  }, [cards, isFilteringLegend, isChampUnitMode, championBaseName, onlyCollection, allCollectionItems]);

  // Render para Leyendas o Champ Units en cuadrícula 3 columnas (Fiel al Screenshot de referencia)
  const renderSpecialGridItem = ({ item }: { item: RiftCard }) => {
    const isThisLegend = currentDeck.legendCard?.id === item.id;
    const isThisChampUnit = currentDeck.championUnit?.id === item.id;
    const isSelected = isLegendOnlyMode ? isThisLegend : isThisChampUnit;
    const cardImageUrl = getCardImageUrl(item);

    const onPressCard = () => {
      if (isLegendOnlyMode) {
        handleSelectLegend(item);
      } else if (isChampUnitMode) {
        handleSelectChampUnit(item);
      } else {
        handleSetCount(item, getCardCountInCurrentDeck(item) + 1);
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.legendGridItem,
          isSelected && styles.legendGridItemSelected,
        ]}
        onPress={onPressCard}
        activeOpacity={0.8}
      >
        <View style={styles.legendGridThumbContainer}>
          <Image
            source={{ uri: cardImageUrl }}
            style={styles.legendGridThumb}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
          {isSelected && (
            <View style={styles.legendSelectedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
          )}
          {isChampUnitMode && (
            <View style={styles.champUnitRibbonBadge}>
              <Ionicons name="ribbon" size={10} color="#38BDF8" style={{ marginRight: 2 }} />
              <Text style={styles.champUnitRibbonText}>CHAMP</Text>
            </View>
          )}
          {item.primaryDomain && (
            <View style={styles.legendGridDomainBadge}>
              <Text style={styles.legendGridDomainText}>
                {item.primaryDomain}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.legendGridName} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render estándar para Unidades, Hechizos, Gear y Campos (Permite + / - / 3 copias)
  const renderCardRow = ({ item }: { item: RiftCard }) => {
    const isLegend = (item.type || item.cardType || '').toLowerCase().includes('legend');
    const isThisLegend = currentDeck.legendCard?.id === item.id;
    const countInDeck = getCardCountInCurrentDeck(item);
    const ownedCopies = getCardOwnership(item.id)?.totalCopies || 0;

    return (
      <View style={styles.cardItem}>
        <Image
          source={{ uri: getCardImageUrl(item) }}
          style={styles.cardThumb}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />

        <View style={styles.cardInfo}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.energyCost !== undefined && (
              <View style={styles.energyCostBadge}>
                <Ionicons name="flash" size={11} color="#3B82F6" style={{ marginRight: 2 }} />
                <Text style={styles.energyCostText}>{item.energyCost}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: '#1E293B' }]}>
              <Text style={styles.typeBadgeText}>{item.type || 'Carta'}</Text>
            </View>
            <View style={[styles.domainBadge, { backgroundColor: '#1E293B' }]}>
              <Text style={[styles.domainBadgeText, { color: '#CBD5E1' }]}>
                {item.primaryDomain || item.domains?.[0] || 'Incoloro'}
              </Text>
            </View>
            <Text style={styles.ownershipText}>
              En colección: <Text style={{ fontWeight: '700', color: ownedCopies > 0 ? '#10B981' : '#64748B' }}>{ownedCopies}</Text>
            </Text>
          </View>
        </View>

        {/* Acciones de añadir / quitar */}
        <View style={styles.actionContainer}>
          {isLegend ? (
            isThisLegend ? (
              <TouchableOpacity
                style={styles.legendActiveBtn}
                onPress={() => handleSetCount(item, 0)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={styles.legendActiveText}>Asignada</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.legendAssignBtn}
                onPress={() => handleSelectLegend(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="trophy-outline" size={14} color="#EAB308" style={{ marginRight: 4 }} />
                <Text style={styles.legendAssignText}>Asignar</Text>
              </TouchableOpacity>
            )
          ) : countInDeck === 0 ? (
            <TouchableOpacity
              style={styles.addInitialBtn}
              onPress={() => handleSetCount(item, 1)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addInitialText}>Añadir</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.counterBox}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => handleSetCount(item, countInDeck - 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <View style={[styles.counterDisplay, countInDeck >= 3 && styles.counterDisplayMax]}>
                <Text style={[styles.counterDisplayText, countInDeck >= 3 && styles.counterDisplayTextMax]}>
                  {countInDeck}/3
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.counterBtn, countInDeck >= 3 && styles.counterBtnDisabled]}
                onPress={() => handleSetCount(item, Math.min(3, countInDeck + 1))}
                disabled={countInDeck >= 3}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={countInDeck >= 3 ? '#64748B' : '#3B82F6'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header Superior */}
        <View style={styles.header}>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>
              {isLegendOnlyMode
                ? 'Elegir Leyenda'
                : isChampUnitMode
                ? `Campeón (${championBaseName || 'Leyenda'})`
                : 'Añadir cartas'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Mazo: <Text style={{ color: '#3B82F6', fontWeight: '700' }}>{currentDeck.name}</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        {/* Guía informativa si estamos eligiendo leyenda o champ unit */}
        {isLegendOnlyMode ? (
          <View style={styles.legendNoticeBanner}>
            <Ionicons name="information-circle" size={16} color="#EAB308" />
            <Text style={styles.legendNoticeText}>
              Selecciona tu Leyenda (Campeón). Al tocarla se asignará a tu mazo y se cerrará la lista automáticamente.
            </Text>
          </View>
        ) : isChampUnitMode ? (
          <View
            style={[
              styles.legendNoticeBanner,
              { borderColor: 'rgba(56, 189, 248, 0.35)', backgroundColor: 'rgba(56, 189, 248, 0.1)' },
            ]}
          >
            <Ionicons name="ribbon" size={16} color="#38BDF8" />
            <Text style={[styles.legendNoticeText, { color: '#7DD3FC' }]}>
              Selecciona la Unidad Campeón de tu Leyenda ({championBaseName}). Solo se muestran cartas que corresponden a este Campeón.
            </Text>
          </View>
        ) : (
          /* Barra de Estadísticas Rápidas en Vivo para cartas normales */
          <View style={styles.statsBar}>
            <View style={styles.statChip}>
              <Text style={styles.statChipLabel}>Mazo principal:</Text>
              <Text style={[styles.statChipValue, stats.totalCards === 40 ? styles.statOk : stats.totalCards > 40 ? styles.statErr : null]}>
                {stats.totalCards}/40
              </Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipLabel}>Campos:</Text>
              <Text style={[styles.statChipValue, stats.battlefieldsCount === 3 ? styles.statOk : null]}>
                {stats.battlefieldsCount}/3
              </Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipLabel}>Leyenda:</Text>
              <Text style={[styles.statChipValue, currentDeck.legendCard ? styles.statOk : styles.statErr]}>
                {currentDeck.legendCard ? '1/1' : '0/1'}
              </Text>
            </View>
          </View>
        )}

        {/* Input de Búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              isLegendOnlyMode
                ? "Buscar por nombre de Leyenda..."
                : isChampUnitMode
                ? `Buscar unidad de ${championBaseName}...`
                : "Buscar por nombre de carta..."
            }
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros de Tipo (Oculto si se eligen Leyendas o Champ Unit) */}
        {!isLegendOnlyMode && !isChampUnitMode && (
          <View style={styles.filtersWrapper}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={TYPE_FILTERS}
              keyExtractor={item => item.key}
              contentContainerStyle={styles.filtersList}
              renderItem={({ item }) => {
                const isSelected = selectedType === item.key;
                return (
                  <TouchableOpacity
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedType(item.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={14}
                      color={isSelected ? '#FFFFFF' : '#94A3B8'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Filtros de Dominio & Toggle de Colección */}
        <View style={styles.domainFiltersRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={DOMAIN_FILTERS}
            keyExtractor={item => item.key}
            contentContainerStyle={styles.domainFiltersList}
            renderItem={({ item }) => {
              const isSelected = selectedDomain === item.key;
              return (
                <TouchableOpacity
                  style={[
                    styles.domainChip,
                    isSelected && { borderColor: item.color, backgroundColor: `${item.color}20` },
                  ]}
                  onPress={() => setSelectedDomain(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.domainDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.domainChipText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity
            style={[styles.collectionToggleBtn, onlyCollection && styles.collectionToggleBtnActive]}
            onPress={() => setOnlyCollection(!onlyCollection)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={onlyCollection ? 'cube' : 'cube-outline'}
              size={13}
              color={onlyCollection ? '#10B981' : '#94A3B8'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.collectionToggleText, onlyCollection && { color: '#10B981', fontWeight: '700' }]}>
              Mi Colección
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Cartas: Si es Leyenda o Champ Unit usa cuadrícula de 3 columnas fiel al screenshot */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>
              {isLegendOnlyMode
                ? 'Buscando leyendas en el catálogo...'
                : isChampUnitMode
                ? `Buscando unidades de ${championBaseName}...`
                : 'Buscando cartas en el catálogo...'}
            </Text>
          </View>
        ) : (isLegendOnlyMode || isChampUnitMode || isFilteringLegend) ? (
          <FlatList
            key={isChampUnitMode ? "champ-grid-3" : "legend-grid-3"}
            data={displayedCards}
            keyExtractor={item => item.id}
            numColumns={3}
            renderItem={renderSpecialGridItem}
            contentContainerStyle={styles.legendGridContainer}
            columnWrapperStyle={styles.legendGridRow}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (nextCursor && !isLoadingMore) {
                loadCards(false);
              }
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMoreBox}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                </View>
              ) : undefined
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={isChampUnitMode ? "ribbon-outline" : "trophy-outline"}
                  size={48}
                  color="#475569"
                />
                <Text style={styles.emptyTitle}>
                  {isChampUnitMode
                    ? `No se encontraron unidades de ${championBaseName}`
                    : 'No se encontraron Leyendas'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  Prueba a ajustar el filtro de dominio o la búsqueda.
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            key="normal-card-list"
            data={displayedCards}
            keyExtractor={item => item.id}
            renderItem={renderCardRow}
            contentContainerStyle={styles.cardsList}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (nextCursor && !isLoadingMore) {
                loadCards(false);
              }
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMoreBox}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                </View>
              ) : undefined
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No se encontraron cartas</Text>
                <Text style={styles.emptySubtitle}>
                  Prueba a cambiar los filtros o el texto de búsqueda.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  doneBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  legendNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    gap: 8,
  },
  legendNoticeText: {
    flex: 1,
    color: '#FDE047',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0F1522',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statChipLabel: {
    color: '#64748B',
    fontSize: 11,
    marginRight: 4,
  },
  statChipValue: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  statOk: {
    color: '#10B981',
  },
  statErr: {
    color: '#EF4444',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101726',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  clearSearchBtn: {
    padding: 2,
  },
  filtersWrapper: {
    marginTop: 8,
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  domainFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
  },
  domainFiltersList: {
    gap: 6,
  },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  domainDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  domainChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  collectionToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginLeft: 6,
  },
  collectionToggleBtnActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  collectionToggleText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  // Estilos Cuadrícula de Leyendas (3 Columnas)
  legendGridContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  legendGridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  legendGridItem: {
    width: GRID_COL_WIDTH,
    alignItems: 'center',
  },
  legendGridItemSelected: {
    transform: [{ scale: 1.02 }],
  },
  legendGridThumbContainer: {
    width: GRID_COL_WIDTH,
    height: GRID_COL_HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#161F30',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    position: 'relative',
  },
  legendGridThumb: {
    width: '100%',
    height: '100%',
  },
  legendSelectedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(9, 13, 20, 0.85)',
    borderRadius: 10,
  },
  champUnitRibbonBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 20, 0.9)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  champUnitRibbonText: {
    color: '#38BDF8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  legendGridDomainBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(9, 13, 20, 0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  legendGridDomainText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '700',
  },
  legendGridName: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  // Estilos Lista Normal
  cardsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  cardThumb: {
    width: 48,
    height: 68,
    borderRadius: 6,
    backgroundColor: '#161F30',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  energyCostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  energyCostText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  domainBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  domainBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ownershipText: {
    color: '#64748B',
    fontSize: 10,
    marginLeft: 4,
  },
  actionContainer: {
    marginLeft: 8,
  },
  addInitialBtn: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addInitialText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161F30',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  counterBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterDisplay: {
    paddingHorizontal: 6,
  },
  counterDisplayMax: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 4,
  },
  counterDisplayText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  counterDisplayTextMax: {
    color: '#10B981',
  },
  legendAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAB308',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  legendAssignText: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '700',
  },
  legendActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  legendActiveText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8E9AA8',
    fontSize: 13,
    marginTop: 10,
  },
  loadingMoreBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
});
