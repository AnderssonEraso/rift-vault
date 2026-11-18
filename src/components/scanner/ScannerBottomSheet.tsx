import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiftCard } from '@/types/card';
import { CardMatchCandidate } from '@/utils/cardMatcher';
import { useCollection } from '@/context/CollectionContext';
import { useDecks } from '@/context/DeckContext';

interface ScannerBottomSheetProps {
  card: RiftCard;
  confidence: number;
  candidates?: CardMatchCandidate[];
  initialFolderId?: string;
  onSelectCandidate?: (card: RiftCard) => void;
  onDismiss: () => void;
  onCardAddedSuccess?: (cardName: string) => void;
  onAddToTrade?: (card: RiftCard) => void;
}

export const ScannerBottomSheet: React.FC<ScannerBottomSheetProps> = ({
  card,
  confidence,
  candidates = [],
  initialFolderId,
  onSelectCandidate,
  onDismiss,
  onCardAddedSuccess,
  onAddToTrade,
}) => {
  const { folders, quickAddCard } = useCollection();
  const { decks, addCardToDeck } = useDecks();

  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolderId || folders[0]?.id || 'all'
  );
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    decks[0]?.id || ''
  );
  const [isFoil, setIsFoil] = useState(false);
  const [activeActionTab, setActiveActionTab] = useState<'collection' | 'deck'>(
    'collection'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dominio y color temático
  const primaryDomain = card.primaryDomain || card.domains?.[0] || 'fury';
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

  const domainColor = getDomainColor(primaryDomain);

  // Agregar a Colección
  const handleAddToCollection = async () => {
    try {
      setIsSubmitting(true);
      await quickAddCard(card, isFoil, selectedFolderId);
      onCardAddedSuccess?.(card.name);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Agregar al Mazo
  const handleAddToDeck = async () => {
    if (!selectedDeckId) return;
    try {
      setIsSubmitting(true);
      const cardType = (card.type || card.cardType || '').toLowerCase();
      const targetSection = cardType.includes('unit')
        ? 'mainUnits'
        : cardType.includes('gear')
        ? 'mainGear'
        : cardType.includes('battlefield') || cardType.includes('landmark')
        ? 'battlefields'
        : 'mainSpells';

      addCardToDeck(selectedDeckId, card, targetSection);
      onCardAddedSuccess?.(`${card.name} (al mazo)`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.sheetContainer}>
      {/* Barra superior de arrastre */}
      <View style={styles.dragHandle} />

      {/* Header de la carta detectada */}
      <View style={styles.cardHeaderRow}>
        <View style={[styles.cardThumbWrapper, { borderColor: domainColor }]}>
          <Image
            source={{
              uri:
                card.imageUrl ||
                card.thumbnailUrl ||
                'https://via.placeholder.com/200x280/151B26/C8AA6E?text=TCG',
            }}
            style={styles.cardThumb}
          />
          {isFoil && (
            <View style={styles.foilBadge}>
              <Ionicons name="sparkles" size={10} color="#FBBF24" />
            </View>
          )}
        </View>

        <View style={styles.cardHeaderInfo}>
          <View style={styles.titleAndConfidence}>
            <Text style={styles.cardName} numberOfLines={2}>
              {card.name}
            </Text>
            <View
              style={[
                styles.confidencePill,
                confidence >= 80 ? styles.confHigh : styles.confMid,
              ]}
            >
              <Text style={styles.confidenceText}>{confidence}% coincidencia</Text>
            </View>
          </View>

          {/* Atributos: Tipo, Coste, Poder, Precio */}
          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { borderColor: `${domainColor}55` }]}>
              <Text style={[styles.metaPillText, { color: domainColor }]}>
                {card.type || 'Carta'}
              </Text>
            </View>

            {card.energyCost !== undefined && (
              <View style={styles.metaPill}>
                <Ionicons name="flash-outline" size={11} color="#60A5FA" />
                <Text style={styles.metaPillText}>{card.energyCost} Coste</Text>
              </View>
            )}

            {card.might !== undefined && (
              <View style={styles.metaPill}>
                <Ionicons name="shield-outline" size={11} color="#FBBF24" />
                <Text style={styles.metaPillText}>{card.might} Poder</Text>
              </View>
            )}

            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>
                ${(card.marketPriceUsd || card.prices?.usd || 0.25).toFixed(2)} USD
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Otras sugerencias si la confianza no es 100% */}
      {candidates.length > 1 && (
        <View style={styles.candidatesSection}>
          <Text style={styles.candidatesLabel}>¿No es esta carta? Elige una opción:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.candidatesRow}>
            {candidates.slice(1, 4).map(({ card: candCard, score }) => (
              <TouchableOpacity
                key={candCard.id}
                style={styles.candidateChip}
                onPress={() => onSelectCandidate?.(candCard)}
              >
                <Text style={styles.candidateChipText} numberOfLines={1}>
                  {candCard.name} ({score}%)
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Selector de Pestaña de Acción: [A Colección] vs [A un Mazo] */}
      <View style={styles.actionTabsRow}>
        <TouchableOpacity
          style={[styles.actionTab, activeActionTab === 'collection' && styles.actionTabActive]}
          onPress={() => setActiveActionTab('collection')}
        >
          <Ionicons
            name="file-tray-full-outline"
            size={15}
            color={activeActionTab === 'collection' ? '#FFFFFF' : '#94A3B8'}
          />
          <Text
            style={[
              styles.actionTabText,
              activeActionTab === 'collection' && styles.actionTabTextActive,
            ]}
          >
            Añadir a Colección
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionTab, activeActionTab === 'deck' && styles.actionTabActive]}
          onPress={() => setActiveActionTab('deck')}
        >
          <Ionicons
            name="albums-outline"
            size={15}
            color={activeActionTab === 'deck' ? '#FFFFFF' : '#94A3B8'}
          />
          <Text
            style={[
              styles.actionTabText,
              activeActionTab === 'deck' && styles.actionTabTextActive,
            ]}
          >
            Añadir a Mazo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según pestaña */}
      {activeActionTab === 'collection' ? (
        <View style={styles.sectionBody}>
          <View style={styles.folderSelectionRow}>
            <Text style={styles.sectionSmallTitle}>CARPETA DESTINO:</Text>
            {/* Opción Foil / Normal */}
            <TouchableOpacity
              style={[styles.foilToggleBtn, isFoil && styles.foilToggleBtnActive]}
              onPress={() => setIsFoil(!isFoil)}
            >
              <Ionicons
                name={isFoil ? 'sparkles' : 'sparkles-outline'}
                size={13}
                color={isFoil ? '#FBBF24' : '#64748B'}
              />
              <Text style={[styles.foilToggleText, isFoil && styles.foilToggleTextActive]}>
                Foil / Reflectante
              </Text>
            </TouchableOpacity>
          </View>

          {/* Carrusel horizontal de carpetas */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foldersList}>
            {folders.map(f => {
              const isSelected = selectedFolderId === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.folderPill, isSelected && styles.folderPillSelected]}
                  onPress={() => setSelectedFolderId(f.id)}
                >
                  <Text style={styles.folderIcon}>{f.icon || '📦'}</Text>
                  <Text style={[styles.folderName, isSelected && styles.folderNameSelected]} numberOfLines={1}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Botones de Guardar */}
          <View style={styles.buttonsRow}>
            {onAddToTrade && (
              <TouchableOpacity
                style={styles.tradeBtn}
                onPress={() => {
                  onAddToTrade(card);
                  onCardAddedSuccess?.(`${card.name} (a intercambio)`);
                }}
              >
                <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
                <Text style={styles.tradeBtnText}>Intercambio</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.confirmAddBtn, { backgroundColor: domainColor }]}
              onPress={handleAddToCollection}
              disabled={isSubmitting}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.confirmAddText}>
                {isSubmitting ? 'Guardando...' : '+1 a Colección'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Modo Mazo */
        <View style={styles.sectionBody}>
          <Text style={styles.sectionSmallTitle}>SELECCIONA EL MAZO DESTINO:</Text>
          {decks.length === 0 ? (
            <Text style={styles.noDecksText}>
              Aún no tienes mazos creados. Ve a la sección de Mazos para crear uno.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foldersList}>
              {decks.map(d => {
                const isSelected = selectedDeckId === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.folderPill,
                      isSelected && { borderColor: d.color || '#3B82F6', backgroundColor: '#1E293B' },
                    ]}
                    onPress={() => setSelectedDeckId(d.id)}
                  >
                    <Ionicons
                      name={(d.icon || 'sparkles') as any}
                      size={14}
                      color={d.color || '#3B82F6'}
                    />
                    <Text style={[styles.folderName, isSelected && styles.folderNameSelected]} numberOfLines={1}>
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.confirmAddBtn, { backgroundColor: '#3B82F6', marginTop: 10 }]}
            onPress={handleAddToDeck}
            disabled={!selectedDeckId || isSubmitting}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.confirmAddText}>
              {isSubmitting ? 'Añadiendo...' : '+1 al Mazo'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardThumbWrapper: {
    width: 60,
    height: 84,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#090D14',
    position: 'relative',
  },
  cardThumb: {
    width: '100%',
    height: '100%',
  },
  foilBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 2,
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  titleAndConfidence: {
    marginBottom: 6,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 20,
  },
  confidencePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  confHigh: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  confMid: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 3,
  },
  metaPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  pricePill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  pricePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60A5FA',
  },
  closeBtn: {
    padding: 6,
    alignSelf: 'flex-start',
  },
  candidatesSection: {
    marginBottom: 10,
    backgroundColor: '#090D14',
    padding: 8,
    borderRadius: 8,
  },
  candidatesLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '600',
  },
  candidatesRow: {
    gap: 6,
  },
  candidateChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  candidateChipText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  actionTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#090D14',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  actionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  actionTabActive: {
    backgroundColor: '#1E293B',
  },
  actionTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  actionTabTextActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  sectionBody: {
    gap: 8,
  },
  folderSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSmallTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  foilToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  foilToggleBtnActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  foilToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  foilToggleTextActive: {
    color: '#FBBF24',
  },
  foldersList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  folderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  folderPillSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
  },
  folderIcon: {
    fontSize: 12,
  },
  folderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  folderNameSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  tradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  tradeBtnText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 12,
  },
  confirmAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  confirmAddText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  noDecksText: {
    color: '#64748B',
    fontSize: 12,
    paddingVertical: 6,
  },
});
