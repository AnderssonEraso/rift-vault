import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CommunityDeck, MetaTierItem, CommunityDeckSort } from '@/types/community';
import { CommunityDeckRepository } from '@/services/communityDeckRepository';
import { CommunityDeckCard } from '@/components/community/CommunityDeckCard';
import { MetaTierListView } from '@/components/community/MetaTierListView';
import { DeckDetailView } from '@/components/decks/DeckDetailView';
import { Deck } from '@/types/deck';

interface CommunityHubScreenProps {
  onBack?: () => void;
  initialTab?: 'meta' | 'community';
}

const DOMAINS = [
  { key: 'all', label: 'Todos' },
  { key: 'fury', label: 'Fury', color: '#EF4444' },
  { key: 'calm', label: 'Calm', color: '#38BDF8' },
  { key: 'mind', label: 'Mind', color: '#A855F7' },
  { key: 'body', label: 'Body', color: '#10B981' },
  { key: 'chaos', label: 'Chaos', color: '#F59E0B' },
  { key: 'order', label: 'Order', color: '#E2E8F0' },
];

const TAGS = ['all', 'Competitivo', 'Budget', 'Fun', 'Aggro', 'Control', 'Combo'];

export const CommunityHubScreen: React.FC<CommunityHubScreenProps> = ({
  onBack,
  initialTab = 'community',
}) => {
  const [activeTab, setActiveTab] = useState<'meta' | 'community'>(initialTab);

  // Estados de datos
  const [tierList, setTierList] = useState<MetaTierItem[]>([]);
  const [isTierLoading, setIsTierLoading] = useState(true);

  const [communityDecks, setCommunityDecks] = useState<CommunityDeck[]>([]);
  const [isDecksLoading, setIsDecksLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState<CommunityDeckSort>('likes');

  // Vista de detalle si el usuario abre un mazo comunitario
  const [viewingDeck, setViewingDeck] = useState<Deck | null>(null);

  // Cargar Meta Tier List
  const loadTierList = useCallback(async () => {
    try {
      setIsTierLoading(true);
      const data = await CommunityDeckRepository.getMetaTierList();
      setTierList(data);
    } catch (e) {
      console.warn('Error cargando tier list:', e);
    } finally {
      setIsTierLoading(false);
    }
  }, []);

  // Cargar Mazos de la Comunidad
  const loadCommunityDecks = useCallback(
    async (resetPage = false) => {
      const targetPage = resetPage ? 0 : page;
      if (resetPage) {
        setIsDecksLoading(true);
      }

      try {
        const res = await CommunityDeckRepository.getCommunityDecks({
          domain: selectedDomain,
          tag: selectedTag,
          sortBy,
          search,
          page: targetPage,
          limit: 10,
        });

        if (resetPage) {
          setCommunityDecks(res.decks);
          setPage(0);
        } else {
          setCommunityDecks(prev => [...prev, ...res.decks]);
        }
        setHasMore(res.hasMore);
      } catch (e) {
        console.warn('Error cargando mazos comunitarios:', e);
      } finally {
        setIsDecksLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, selectedDomain, selectedTag, sortBy, search]
  );

  useEffect(() => {
    loadTierList();
  }, [loadTierList]);

  useEffect(() => {
    loadCommunityDecks(true);
  }, [selectedDomain, selectedTag, sortBy, search]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'meta') {
      await loadTierList();
      setIsRefreshing(false);
    } else {
      await loadCommunityDecks(true);
    }
  };

  const handleLoadMore = () => {
    if (!isDecksLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 0) {
      loadCommunityDecks(false);
    }
  }, [page]);

  const handleLikeToggle = async (deckId: string) => {
    const res = await CommunityDeckRepository.toggleLike(deckId);
    setCommunityDecks(prev =>
      prev.map(d => {
        if (d.id === deckId) {
          return {
            ...d,
            isLikedByMe: res.liked,
            likesCount: res.liked ? d.likesCount + 1 : Math.max(0, d.likesCount - 1),
          };
        }
        return d;
      })
    );
  };

  // Si está viendo el detalle de un mazo
  if (viewingDeck) {
    return (
      <DeckDetailView
        deck={viewingDeck}
        onBack={() => setViewingDeck(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header Superior */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Hub Comunitario</Text>
          <Text style={styles.headerSubtitle}>Meta Tier List & Mazos de Jugadores</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshIconBtn}>
          <Ionicons name="refresh" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Tabs Superiores: [🏆 Meta Tier List] vs [🌐 Mazos de la Comunidad] */}
      <View style={styles.mainTabsRow}>
        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'community' && styles.mainTabBtnActive]}
          onPress={() => setActiveTab('community')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="people"
            size={16}
            color={activeTab === 'community' ? '#FFFFFF' : '#94A3B8'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.mainTabText, activeTab === 'community' && styles.mainTabTextActive]}>
            Mazos de la Comunidad
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'meta' && styles.mainTabBtnActive]}
          onPress={() => setActiveTab('meta')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="trophy"
            size={16}
            color={activeTab === 'meta' ? '#FBBF24' : '#94A3B8'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.mainTabText, activeTab === 'meta' && styles.mainTabTextActive]}>
            Meta Tier List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según Tab */}
      {activeTab === 'meta' ? (
        isTierLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Cargando estadísticas del Meta...</Text>
          </View>
        ) : (
          <MetaTierListView
            items={tierList}
            onExploreArchetype={item => {
              setActiveTab('community');
              setSelectedDomain(item.primaryDomain.toLowerCase());
              setSearch(item.legendName.split(',')[0]);
            }}
          />
        )
      ) : (
        <View style={{ flex: 1 }}>
          {/* Barra de Búsqueda */}
          <View style={styles.searchBarBox}>
            <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por mazo, leyenda o autor..."
              placeholderTextColor="#64748B"
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros de Dominio */}
          <View style={{ height: 38 }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={DOMAINS}
              keyExtractor={item => item.key}
              contentContainerStyle={styles.filterScrollContent}
              renderItem={({ item }) => {
                const isSelected = selectedDomain === item.key;
                return (
                  <TouchableOpacity
                    style={[
                      styles.filterPill,
                      isSelected && styles.filterPillActive,
                      isSelected && item.color ? { borderColor: item.color } : null,
                    ]}
                    onPress={() => setSelectedDomain(item.key)}
                  >
                    {item.color && (
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    )}
                    <Text
                      style={[
                        styles.filterPillText,
                        isSelected && styles.filterPillTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Filtros de Etiquetas y Orden */}
          <View style={styles.subFiltersRow}>
            {/* Chips de Tags */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={TAGS}
              keyExtractor={tag => tag}
              contentContainerStyle={styles.tagsScrollContent}
              renderItem={({ item: tag }) => {
                const isSelected = selectedTag === tag;
                return (
                  <TouchableOpacity
                    style={[styles.tagFilterChip, isSelected && styles.tagFilterChipActive]}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <Text style={[styles.tagFilterText, isSelected && styles.tagFilterTextActive]}>
                      {tag === 'all' ? 'Todos los tags' : tag}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Selector de Orden */}
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[styles.sortBtn, sortBy === 'likes' && styles.sortBtnActive]}
                onPress={() => setSortBy('likes')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.sortBtnText, sortBy === 'likes' && styles.sortBtnTextActive]}>
                  Votos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortBtn, sortBy === 'recent' && styles.sortBtnActive]}
                onPress={() => setSortBy('recent')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.sortBtnText, sortBy === 'recent' && styles.sortBtnTextActive]}>
                  Recientes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortBtn, sortBy === 'tier' && styles.sortBtnActive]}
                onPress={() => setSortBy('tier')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.sortBtnText, sortBy === 'tier' && styles.sortBtnTextActive]}>
                  Tier
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Mazos Comunitarios */}
          {isDecksLoading && communityDecks.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Cargando mazos de la comunidad...</Text>
            </View>
          ) : (
            <FlatList
              data={communityDecks}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.decksListContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#3B82F6" />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="albums-outline" size={48} color="#475569" />
                  <Text style={styles.emptyTitle}>No se encontraron mazos</Text>
                  <Text style={styles.emptySubtitle}>
                    Prueba ajustando los filtros de dominio, etiquetas o término de búsqueda.
                  </Text>
                </View>
              }
              ListFooterComponent={
                hasMore && communityDecks.length > 0 ? (
                  <View style={{ paddingVertical: 16 }}>
                    <ActivityIndicator size="small" color="#94A3B8" />
                  </View>
                ) : undefined
              }
              renderItem={({ item }) => (
                <CommunityDeckCard
                  item={item}
                  onLikeToggle={handleLikeToggle}
                  onViewDeck={deckItem => setViewingDeck(deckItem.deckData)}
                />
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D14',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  refreshIconBtn: {
    padding: 6,
  },
  mainTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#090D14',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 8,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  mainTabBtnActive: {
    backgroundColor: '#1E293B',
    borderColor: '#3B82F6',
  },
  mainTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  mainTabTextActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  filterPillActive: {
    backgroundColor: '#1E293B',
    borderColor: '#3B82F6',
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  filterPillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 8,
    gap: 8,
  },
  tagsScrollContent: {
    gap: 6,
  },
  tagFilterChip: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagFilterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  tagFilterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tagFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sortContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 2,
  },
  sortBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sortBtnActive: {
    backgroundColor: '#1E293B',
  },
  sortBtnText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  decksListContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    paddingTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 18,
  },
});
