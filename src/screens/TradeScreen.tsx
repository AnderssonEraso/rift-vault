import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiftCard } from '@/types/card';
import { TradeCardItem } from '@/types/trade';
import { fetchCards } from '@/services/openRiftApi';

interface TradeScreenProps {
  onBack?: () => void;
}

export const TradeScreen: React.FC<TradeScreenProps> = ({ onBack }) => {
  // Lista de cartas vacías inicialmente (sin datos quemados)
  const [myCards, setMyCards] = useState<TradeCardItem[]>([]);
  const [theirCards, setTheirCards] = useState<TradeCardItem[]>([]);

  // Selector modal de cartas y búsqueda en OpenRift
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [pickingSide, setPickingSide] = useState<'my' | 'their'>('my');
  const [cardSearch, setCardSearch] = useState('');
  const [searchResults, setSearchResults] = useState<RiftCard[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Buscar en tiempo real cuando se escribe en el selector
  React.useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      if (!isPickerVisible) return;
      setIsSearching(true);
      try {
        const res = await fetchCards({ query: cardSearch.trim() || 'Zed', limit: 15 });
        if (active) {
          setSearchResults(res.cards);
        }
      } catch (e) {
        // Ignorar
      } finally {
        if (active) setIsSearching(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [cardSearch, isPickerVisible]);

  // Cálculos de totales
  const myTotal = myCards.reduce((acc, c) => acc + c.unitPriceUsd * c.count, 0);
  const theirTotal = theirCards.reduce((acc, c) => acc + c.unitPriceUsd * c.count, 0);
  const difference = Math.abs(myTotal - theirTotal);

  // Manejo de cantidades
  const handleUpdateCount = (side: 'my' | 'their', id: string, delta: number) => {
    const list = side === 'my' ? myCards : theirCards;
    const setList = side === 'my' ? setMyCards : setTheirCards;

    setList(
      list
        .map(item => {
          if (item.id === id) {
            const newCount = item.count + delta;
            return newCount > 0 ? { ...item, count: newCount } : null;
          }
          return item;
        })
        .filter(Boolean) as TradeCardItem[]
    );
  };

  const handleRemove = (side: 'my' | 'their', id: string) => {
    const list = side === 'my' ? myCards : theirCards;
    const setList = side === 'my' ? setMyCards : setTheirCards;
    setList(list.filter(item => item.id !== id));
  };

  const handleOpenPicker = (side: 'my' | 'their') => {
    setPickingSide(side);
    setIsPickerVisible(true);
  };

  const handleAddCard = (card: RiftCard) => {
    const side = pickingSide;
    const list = side === 'my' ? myCards : theirCards;
    const setList = side === 'my' ? setMyCards : setTheirCards;

    const existing = list.find(item => item.card.id === card.id);
    if (existing) {
      setList(
        list.map(item =>
          item.card.id === card.id ? { ...item, count: item.count + 1 } : item
        )
      );
    } else {
      setList([
        ...list,
        {
          id: `item_${Date.now()}_${Math.random()}`,
          card,
          count: 1,
          unitPriceUsd: card.marketPriceUsd || 0.10,
        },
      ]);
    }
    setIsPickerVisible(false);
  };

  const handleValidateTrade = () => {
    const highest = Math.max(myTotal, theirTotal);
    const diffPct = highest > 0 ? (difference / highest) * 100 : 0;

    let verdict = '¡Intercambio Justo y Equilibrado!';
    let detail = `La diferencia de valor es de tan solo $${difference.toFixed(2)} (${diffPct.toFixed(1)}%). Ambos jugadores reciben un valor muy parejo según los precios de mercado actuales de OpenRift.`;

    if (diffPct > 20) {
      const favored = myTotal > theirTotal ? 'Tú sales ganando más' : 'El otro jugador sale ganando más';
      verdict = 'Intercambio Desigual';
      detail = `Existe una diferencia de $${difference.toFixed(2)} (${diffPct.toFixed(1)}%). ${favored}. Recomendamos equilibrar agregando otra carta o ajustando las cantidades.`;
    }

    Alert.alert(verdict, detail, [
      { text: 'Aceptar Intercambio', onPress: () => Alert.alert('Completado', 'El intercambio ha sido registrado.') },
      { text: 'Cerrar', style: 'cancel' },
    ]);
  };

  const myCardCount = myCards.reduce((acc, c) => acc + c.count, 0);
  const theirCardCount = theirCards.reduce((acc, c) => acc + c.count, 0);

  return (
    <View style={styles.container}>
      {/* Header Fiel a Screenshot 3 */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Intercambio</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => Alert.alert('Historial', 'No hay intercambios recientes archivados.')}
        >
          <Ionicons name="time-outline" size={22} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      {/* Main 2-Column Split Area */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.columnsContainer}>
          {/* Columna Izquierda: Tú */}
          <View style={styles.column}>
            <Text style={styles.columnHeaderTitle}>
              Tú ({myCardCount} {myCardCount === 1 ? 'carta' : 'cartas'})
            </Text>

            {/* Ranura con borde discontinuo para añadir */}
            <TouchableOpacity
              style={styles.addSlotButton}
              onPress={() => handleOpenPicker('my')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#64748B" />
            </TouchableOpacity>

            {/* Lista de cartas agregadas de Tú */}
            {myCards.map(item => (
              <View key={item.id} style={styles.tradeCardRow}>
                <View style={styles.cardImageContainer}>
                  <Image
                    source={{ uri: item.card.imageUrl || item.card.thumbnailUrl }}
                    style={styles.cardThumbnail}
                  />
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagText}>${item.unitPriceUsd.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.cardName} numberOfLines={2}>
                    {item.card.name}
                  </Text>
                  <View style={styles.countControls}>
                    <TouchableOpacity
                      onPress={() => handleRemove('my', item.id)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>

                    <Text style={styles.countText}>{item.count}</Text>

                    <TouchableOpacity
                      onPress={() => handleUpdateCount('my', item.id, 1)}
                      style={styles.plusBtn}
                    >
                      <Ionicons name="add" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.rowTotalText}>
                    Total: ${(item.unitPriceUsd * item.count).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Línea divisoria central */}
          <View style={styles.verticalDivider} />

          {/* Columna Derecha: Otro Jugador */}
          <View style={styles.column}>
            <Text style={styles.columnHeaderTitle}>
              Otro jugador ({theirCardCount} {theirCardCount === 1 ? 'carta' : 'cartas'})
            </Text>

            {/* Ranura con borde discontinuo para añadir */}
            <TouchableOpacity
              style={styles.addSlotButton}
              onPress={() => handleOpenPicker('their')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#64748B" />
            </TouchableOpacity>

            {/* Lista de cartas agregadas de Otro Jugador */}
            {theirCards.map(item => (
              <View key={item.id} style={styles.tradeCardRow}>
                <View style={styles.cardImageContainer}>
                  <Image
                    source={{ uri: item.card.imageUrl || item.card.thumbnailUrl }}
                    style={styles.cardThumbnail}
                  />
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagText}>${item.unitPriceUsd.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.cardName} numberOfLines={2}>
                    {item.card.name}
                  </Text>
                  <View style={styles.countControls}>
                    <TouchableOpacity
                      onPress={() => handleRemove('their', item.id)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>

                    <Text style={styles.countText}>{item.count}</Text>

                    <TouchableOpacity
                      onPress={() => handleUpdateCount('their', item.id, 1)}
                      style={styles.plusBtn}
                    >
                      <Ionicons name="add" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.rowTotalText}>
                    Total: ${(item.unitPriceUsd * item.count).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Summary Bar Fiel a Screenshot 3 */}
      <View style={styles.footerContainer}>
        <View style={styles.summaryPillsRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryPillText}>${myTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryLine} />
          <View style={[styles.summaryPill, styles.differencePill]}>
            <Text style={styles.differencePillText}>${difference.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryLine} />
          <View style={styles.summaryPill}>
            <Text style={styles.summaryPillText}>${theirTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Botón azul "Validar" Fiel a Screenshot 3 */}
        <TouchableOpacity
          style={styles.validateButton}
          onPress={handleValidateTrade}
          activeOpacity={0.85}
        >
          <Text style={styles.validateButtonText}>Validar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para seleccionar cartas */}
      <Modal visible={isPickerVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                Seleccionar para {pickingSide === 'my' ? 'Tú' : 'Otro jugador'}
              </Text>
              <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.pickerSearchInput}
              value={cardSearch}
              onChangeText={setCardSearch}
              placeholder="Buscar por nombre..."
              placeholderTextColor="#64748B"
            />

            {isSearching ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: '#8E9AA8' }}>Buscando en OpenRift API...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B' }}>No se encontraron cartas.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItemRow}
                    onPress={() => handleAddCard(item)}
                  >
                    <Image source={{ uri: item.thumbnailUrl || item.imageUrl }} style={styles.pickerItemImg} />
                    <View style={styles.pickerItemInfo}>
                      <Text style={styles.pickerItemName}>{item.name}</Text>
                      <Text style={styles.pickerItemCode}>{item.publicCode || ''} • {item.type || item.cardType || ''}</Text>
                    </View>
                    <View style={styles.pickerItemPriceBadge}>
                      <Text style={styles.pickerItemPriceText}>
                        ${(item.marketPriceUsd || item.prices?.usd || 0.10).toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  historyBtn: {
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  columnsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  column: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#1E293B',
  },
  columnHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 14,
  },
  addSlotButton: {
    height: 70,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#26334D',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(22, 31, 48, 0.4)',
  },
  tradeCardRow: {
    backgroundColor: '#0F1522',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardImageContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  cardThumbnail: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  priceTag: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#090D14',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  priceTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  cardDetails: {
    marginTop: 8,
  },
  cardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  countControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161F30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  deleteBtn: {
    padding: 2,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  plusBtn: {
    padding: 2,
  },
  rowTotalText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#090D14',
    borderTopWidth: 1,
    borderTopColor: '#161F30',
  },
  summaryPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryPill: {
    backgroundColor: '#161F30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#26334D',
  },
  summaryPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  summaryLine: {
    width: 28,
    height: 2,
    backgroundColor: '#26334D',
  },
  differencePill: {
    backgroundColor: '#1E293B',
    borderColor: '#3B82F6',
  },
  differencePillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60A5FA',
  },
  validateButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#0F1522',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  pickerSearchInput: {
    backgroundColor: '#161F30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26334D',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
  },
  pickerItemImg: {
    width: 44,
    height: 58,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    marginRight: 12,
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  pickerItemCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  pickerItemPriceBadge: {
    backgroundColor: '#161F30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pickerItemPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
