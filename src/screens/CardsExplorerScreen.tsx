import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { CardItem } from '@/components/cards/CardItem';
import { CardSkeleton } from '@/components/cards/CardSkeleton';
import { FilterChips } from '@/components/cards/FilterChips';
import { SearchBar } from '@/components/cards/SearchBar';
import { fetchCards } from '@/services/openRiftApi';
import { CardDomain, CardType, RiftCard } from '@/types/card';
import { useLanguage } from '@/context/LanguageContext';

const PAGE_LIMIT = 20;

export const CardsExplorerScreen: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();

  // Estados de catálogo y paginación
  const [cards, setCards] = useState<RiftCard[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<CardDomain>('All');
  const [selectedType, setSelectedType] = useState<CardType>('All');
  const [selectedCard, setSelectedCard] = useState<RiftCard | null>(null);

  // Loading & error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFetchingRef = useRef<boolean>(false);

  const loadCards = useCallback(
    async (isRefresh = false) => {
      if (isFetchingRef.current && !isRefresh) return;
      isFetchingRef.current = true;

      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setErrorMessage(null);

        const response = await fetchCards({
          cursor: null,
          limit: PAGE_LIMIT,
          query: searchQuery,
          domain: selectedDomain,
          type: selectedType,
        });

        setCards(response.cards);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } catch (error: any) {
        setErrorMessage(
          error?.message || (language === 'es' ? 'No se pudo conectar con OpenRift.' : 'Failed to connect to OpenRift.')
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [searchQuery, selectedDomain, selectedType, language]
  );

  const loadMoreCards = useCallback(async () => {
    if (isFetchingRef.current || isLoadingMore || !hasMore || isLoading || isRefreshing) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoadingMore(true);

      const response = await fetchCards({
        cursor: nextCursor,
        limit: PAGE_LIMIT,
        query: searchQuery,
        domain: selectedDomain,
        type: selectedType,
      });

      if (response.cards.length > 0) {
        setCards(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const fresh = response.cards.filter(c => !existingIds.has(c.id));
          return [...prev, ...fresh];
        });
      }

      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (error) {
      console.warn('Error en paginación lazy:', error);
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [hasMore, isLoading, isLoadingMore, isRefreshing, nextCursor, searchQuery, selectedDomain, selectedType]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleCardPress = (card: RiftCard) => {
    setSelectedCard(card);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>RiftVault</Text>
          <Text style={styles.appSubtitle}>Catálogo OpenRift TCG</Text>
        </View>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langBtnText}>{language.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador y Filtros */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t.searchPlaceholder}
      />

      <FilterChips
        selectedDomain={selectedDomain}
        onSelectDomain={setSelectedDomain}
        selectedType={selectedType}
        onSelectType={setSelectedType}
      />

      {/* Error Banner */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => loadCards(true)} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>{t.retryButton}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Grid de cartas */}
      {isLoading && !isRefreshing ? (
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4, 5, 6].map(k => (
            <CardSkeleton key={k} />
          ))}
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <CardItem card={item} onPress={handleCardPress} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadCards(true)}
              tintColor="#3B82F6"
            />
          }
          onEndReached={loadMoreCards}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.footerText}>Cargando más cartas...</Text>
              </View>
            ) : undefined
          }
        />
      )}

      {/* Modal de Detalle */}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  langBtn: {
    backgroundColor: '#161F30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26334D',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    justifyContent: 'space-around',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
    marginRight: 8,
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E9AA8',
    marginLeft: 8,
  },
});
