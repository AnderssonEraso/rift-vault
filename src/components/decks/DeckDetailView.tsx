import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Deck, DeckCardSlot } from '@/types/deck';
import { calculateDeckStats } from '@/utils/deckValidation';
import { ExportDeckModal } from './ExportDeckModal';
import { EditDeckModal } from './EditDeckModal';
import { DeckCollectionAnalysisModal } from './DeckCollectionAnalysisModal';
import { RecordMatchModal } from './RecordMatchModal';
import { PublishDeckModal } from './PublishDeckModal';
import { analyzeDeckCollection } from '@/utils/deckCollectionAnalysis';
import { useCollection } from '@/context/CollectionContext';
import { MatchRepository } from '@/services/matchRepository';
import { DeckMatchRecord } from '@/types/match';

interface DeckDetailViewProps {
  deck: Deck;
  onBack: () => void;
  onEditDeck?: (updates?: { name: string; description: string; color: string; icon: string }) => void;
  onDuplicateDeck?: () => void;
  onDeleteDeck?: () => void;
}

export const DeckDetailView: React.FC<DeckDetailViewProps> = ({
  deck,
  onBack,
  onEditDeck,
  onDuplicateDeck,
  onDeleteDeck,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'stats' | 'matches'>('list');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCollectionAnalysisModalOpen, setIsCollectionAnalysisModalOpen] = useState(false);
  const [isRecordMatchModalOpen, setIsRecordMatchModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [matches, setMatches] = useState<DeckMatchRecord[]>([]);

  const stats = calculateDeckStats(deck);
  const { getCardOwnership } = useCollection();

  // Cruce con colección física del usuario
  const collectionAnalysis = useMemo(
    () => analyzeDeckCollection(deck, getCardOwnership),
    [deck, getCardOwnership]
  );

  // Cargar historial de partidas del mazo
  const loadMatches = useCallback(async () => {
    const data = await MatchRepository.getMatchesForDeck(deck.id);
    setMatches(data);
  }, [deck.id]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const matchStats = MatchRepository.calculateStats(matches);

  const deckColor = deck.color || '#3B82F6';
  const deckIcon = deck.icon || 'sparkles';

  const handleShare = () => {
    setIsExportModalOpen(true);
  };

  const renderCardGridItem = (slot: DeckCardSlot) => {
    const ownedCopies = getCardOwnership(slot.cardId)?.totalCopies || 0;
    const isOwned = ownedCopies >= slot.count;

    return (
      <View key={slot.cardId} style={styles.gridCardItem}>
        <View style={styles.cardImageWrapper}>
          <Image source={{ uri: slot.card.imageUrl }} style={styles.gridCardImage} />

          {/* Coste de energía / maná en esquina superior izquierda */}
          {slot.card.energyCost !== undefined && (
            <View style={styles.costBadge}>
              <Text style={styles.costText}>{slot.card.energyCost}</Text>
            </View>
          )}

          {/* Fuerza / Might en esquina superior derecha si aplica */}
          {slot.card.might !== undefined && (
            <View style={styles.mightBadge}>
              <Ionicons name="shield" size={10} color="#FBBF24" />
              <Text style={styles.mightText}>{slot.card.might}</Text>
            </View>
          )}

          {/* Multiplicador de copias x2, x3 si > 1 Fiel a Screenshot 7 */}
          {slot.count > 1 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>x{slot.count}</Text>
            </View>
          )}

          {/* Insignia de posesión en físico */}
          <View
            style={[
              styles.cardOwnershipTag,
              isOwned ? styles.cardOwnershipTagOk : styles.cardOwnershipTagMissing,
            ]}
          >
            <Ionicons
              name={isOwned ? 'checkmark' : 'cube-outline'}
              size={9}
              color={isOwned ? '#10B981' : '#F59E0B'}
            />
            <Text
              style={[
                styles.cardOwnershipText,
                isOwned ? styles.cardOwnershipTextOk : styles.cardOwnershipTextMissing,
              ]}
            >
              {isOwned ? `${ownedCopies}` : `${ownedCopies}/${slot.count}`}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {slot.card.name}
        </Text>
        <Text style={styles.cardPrice}>
          ${(slot.card.marketPriceUsd || 0.10).toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar Fiel a Screenshots 6-9 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.titleIconBadge,
                { backgroundColor: `${deckColor}22`, borderColor: `${deckColor}55` },
              ]}
            >
              <Ionicons name={deckIcon as any} size={15} color={deckColor} />
            </View>
            <Text style={styles.navDeckName}>{deck.name}</Text>
          </View>
          <View style={styles.priceVariationRow}>
            <Text style={styles.headerPrice}>${(deck.priceUsd || 6.68).toFixed(2)}</Text>
            <View style={styles.priceVariationBadge}>
              <Ionicons name="lock-closed-outline" size={10} color="#818CF8" />
              <Text style={styles.priceVariationText}>Variación de precio</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity onPress={() => setIsExportModalOpen(true)} style={styles.iconBtn}>
            <Ionicons name="share-outline" size={22} color="#CBD5E1" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Opciones del Mazo', 'Selecciona una acción:', [
                {
                  text: 'Publicar en la Comunidad (Hub)',
                  onPress: () => setIsPublishModalOpen(true),
                },
                {
                  text: 'Duplicar mazo (Crear variante)',
                  onPress: onDuplicateDeck,
                },
                {
                  text: 'Personalizar mazo (Color, Ícono, Nombre)',
                  onPress: () => setIsEditModalOpen(true),
                },
                {
                  text: 'Exportar mazo (Código o Texto)',
                  onPress: () => setIsExportModalOpen(true),
                },
                {
                  text: 'Registrar partida',
                  onPress: () => setIsRecordMatchModalOpen(true),
                },
                {
                  text: 'Eliminar mazo',
                  style: 'destructive',
                  onPress: onDeleteDeck,
                },
                { text: 'Cancelar', style: 'cancel' },
              ])
            }
            style={styles.iconBtn}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner de Cruce con Colección Física (Opción 2) */}
      <TouchableOpacity
        style={styles.collectionBanner}
        onPress={() => setIsCollectionAnalysisModalOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.collectionBannerLeft}>
          <Ionicons
            name={collectionAnalysis.isFullyOwned ? 'checkmark-circle' : 'cube-outline'}
            size={18}
            color={collectionAnalysis.isFullyOwned ? '#10B981' : '#F59E0B'}
          />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.collectionBannerTitle}>
              {collectionAnalysis.isFullyOwned
                ? '¡Mazo 100% armado en físico!'
                : `${collectionAnalysis.completionPercentage}% listo en físico (${collectionAnalysis.totalOwnedCards}/${collectionAnalysis.totalRequiredCards})`}
            </Text>
            <Text style={styles.collectionBannerSubtitle}>
              {collectionAnalysis.isFullyOwned
                ? 'Tienes todas las cartas en tu inventario'
                : `Faltan ${collectionAnalysis.totalMissingCards} cartas • Est. $${collectionAnalysis.estimatedMissingCostUsd.toFixed(2)} USD`}
            </Text>
          </View>
        </View>
        <View style={styles.collectionBannerPill}>
          <Text style={styles.collectionBannerPillText}>Ver ›</Text>
        </View>
      </TouchableOpacity>

      {/* Tabs: Lista | Estadísticas | Partidas */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'list' && styles.tabBtnTextActive]}>
            Lista
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'stats' && styles.tabBtnActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'stats' && styles.tabBtnTextActive]}>
            Estadísticas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'matches' && styles.tabBtnActive]}
          onPress={() => setActiveTab('matches')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'matches' && styles.tabBtnTextActive]}>
            Partidas ({matches.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contador de vistas */}
        <View style={styles.viewsBadgeRow}>
          <View style={styles.viewsBadge}>
            <Ionicons name="eye-outline" size={13} color="#94A3B8" />
            <Text style={styles.viewsBadgeText}>{deck.viewsCount || 6} vistas</Text>
          </View>
        </View>

        {activeTab === 'list' ? (
          <>
            {/* SECCIÓN 1: LEYENDA (1/1) Y RUNES (12/12) FIEL A SCREENSHOT 6 */}
            <View style={styles.legendRunesRow}>
              {/* Leyenda */}
              <View style={styles.legendBox}>
                <Text style={styles.sectionTitle}>
                  Leyenda <Text style={styles.sectionCounter}>({deck.legendCard ? '1/1' : '0/1'})</Text>
                </Text>
                {deck.legendCard ? (
                  <View style={styles.legendCardPreview}>
                    <Image source={{ uri: deck.legendCard.imageUrl }} style={styles.legendImg} />
                    <Text style={styles.legendName} numberOfLines={2}>
                      {deck.legendCard.name}
                    </Text>
                    <Text style={styles.legendPrice}>
                      ${(deck.legendCard.marketPriceUsd || 0.17).toFixed(2)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptySlot}>
                    <Ionicons name="add" size={28} color="#64748B" />
                    <Text style={styles.emptySlotText}>Añadir Leyenda</Text>
                  </View>
                )}
              </View>

              {/* Runes (12/12) */}
              <View style={styles.runesBox}>
                <Text style={styles.sectionTitle}>
                  Runes <Text style={styles.sectionCounter}>({stats.runesCount}/12)</Text>
                </Text>
                <View style={styles.runesGrid}>
                  {(deck.runes || []).map(r => (
                    <View key={r.id} style={styles.runeSlot}>
                      <View style={styles.runeIconCircle}>
                        <Ionicons
                          name={r.domain === 'calm' ? 'water' : r.domain === 'order' ? 'shield' : 'flame'}
                          size={28}
                          color={r.domain === 'calm' ? '#0AC8B9' : r.domain === 'order' ? '#EAB308' : '#EF4444'}
                        />
                      </View>
                      <Text style={styles.runeCount}>{r.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* SECCIÓN 2: CAMPOS DE BATALLA (3/3) FIEL A SCREENSHOT 6 */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>
                Campos de batalla <Text style={styles.sectionCounter}>({stats.battlefieldsCount}/3)</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.battlefieldsRow}>
                {(deck.battlefields || []).map(bf => (
                  <View key={bf.cardId} style={styles.battlefieldCard}>
                    <Image source={{ uri: bf.card.imageUrl }} style={styles.battlefieldImg} />
                    <Text style={styles.battlefieldTitle} numberOfLines={2}>
                      {bf.card.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* SECCIÓN 3: MAZO PRINCIPAL (40/40) FIEL A SCREENSHOT 7, 8 */}
            <View style={styles.sectionBlock}>
              <View style={styles.mainDeckHeader}>
                <Text style={styles.sectionTitle}>
                  Mazo principal <Text style={styles.sectionCounter}>({stats.totalCards}/40)</Text>
                </Text>
                <View style={styles.sortIndicator}>
                  <Ionicons name="arrow-down" size={14} color="#94A3B8" />
                  <Text style={styles.sortText}>Nombre</Text>
                </View>
              </View>

              {/* Sub-sección: Unidades */}
              <Text style={styles.subCategoryTitle}>
                Unidades <Text style={styles.subCategoryCount}>({stats.unitsCount})</Text>
              </Text>
              <View style={styles.cardsGrid}>
                {(deck.mainUnits || []).map(renderCardGridItem)}
              </View>

              {/* Sub-sección: Gear */}
              <Text style={styles.subCategoryTitle}>
                Gear <Text style={styles.subCategoryCount}>({stats.gearsCount})</Text>
              </Text>
              <View style={styles.cardsGrid}>
                {(deck.mainGear || []).map(renderCardGridItem)}
              </View>

              {/* Sub-sección: Hechizos */}
              <Text style={styles.subCategoryTitle}>
                Hechizos <Text style={styles.subCategoryCount}>({stats.spellsCount})</Text>
              </Text>
              <View style={styles.cardsGrid}>
                {(deck.mainSpells || []).map(renderCardGridItem)}
              </View>
            </View>

            {/* SECCIÓN 4: MAZO SECUNDARIO (0/10) FIEL A SCREENSHOT 9 */}
            <View style={styles.collapsedSectionRow}>
              <Text style={styles.collapsedTitle}>
                Mazo secundario <Text style={styles.collapsedCount}>({stats.sideboardCount}/10)</Text>
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </View>

            {/* SECCIÓN 5: EN CONSIDERACIÓN (0/100) FIEL A SCREENSHOT 9 */}
            <View style={styles.collapsedSectionRow}>
              <Text style={styles.collapsedTitle}>
                En consideración <Text style={styles.collapsedCount}>({stats.maybeboardCount}/100)</Text>
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </View>
          </>
        ) : activeTab === 'stats' ? (
          /* TAB DE ESTADÍSTICAS */
          <View style={styles.statsTabContent}>
            <Text style={styles.statsHeading}>Curva de Maná</Text>
            <View style={styles.manaCurveContainer}>
              {Object.entries(stats.manaCurve).map(([cost, count]) => (
                <View key={cost} style={styles.manaBarCol}>
                  <Text style={styles.manaBarVal}>{count}</Text>
                  <View style={[styles.manaBarFill, { height: Math.max(10, count * 12) }]} />
                  <Text style={styles.manaBarCost}>{cost === '6' ? '6+' : cost}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.statsHeading}>Validez de Reglamento Riftbound</Text>
            <View style={styles.legalityContainer}>
              <View style={styles.legalityRow}>
                <Ionicons
                  name={stats.legality.legendValid ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={stats.legality.legendValid ? '#10B981' : '#EF4444'}
                />
                <Text style={styles.legalityText}>1 Carta de Leyenda (1/1)</Text>
              </View>

              <View style={styles.legalityRow}>
                <Ionicons
                  name={stats.legality.runesValid ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={stats.legality.runesValid ? '#10B981' : '#EF4444'}
                />
                <Text style={styles.legalityText}>12 Runas exactas ({stats.runesCount}/12)</Text>
              </View>

              <View style={styles.legalityRow}>
                <Ionicons
                  name={stats.legality.battlefieldsValid ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={stats.legality.battlefieldsValid ? '#10B981' : '#EF4444'}
                />
                <Text style={styles.legalityText}>3 Campos de Batalla ({stats.battlefieldsCount}/3)</Text>
              </View>

              <View style={styles.legalityRow}>
                <Ionicons
                  name={stats.legality.mainDeckValid ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={stats.legality.mainDeckValid ? '#10B981' : '#EF4444'}
                />
                <Text style={styles.legalityText}>40 Cartas en Mazo Principal ({stats.totalCards}/40)</Text>
              </View>

              <View style={styles.legalityRow}>
                <Ionicons
                  name={stats.legality.copiesValid ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={stats.legality.copiesValid ? '#10B981' : '#EF4444'}
                />
                <Text style={styles.legalityText}>Máximo 3 copias por carta</Text>
              </View>
            </View>
          </View>
        ) : (
          /* TAB DE PARTIDAS Y WINRATE (Opción 4) */
          <View style={styles.matchesTabContent}>
            {/* Tarjeta Hero de Winrate */}
            <View style={styles.winrateHeroCard}>
              <View style={styles.winrateHeroLeft}>
                <Text style={styles.winratePercentText}>{matchStats.winrate}%</Text>
                <Text style={styles.winrateLabel}>TASA DE VICTORIAS</Text>
              </View>

              <View style={styles.winrateHeroRight}>
                <View style={styles.winrateBreakdownRow}>
                  <View style={[styles.matchResultBadge, styles.badgeWin]}>
                    <Text style={styles.badgeWinText}>{matchStats.wins}V</Text>
                  </View>
                  <View style={[styles.matchResultBadge, styles.badgeLoss]}>
                    <Text style={styles.badgeLossText}>{matchStats.losses}D</Text>
                  </View>
                  {matchStats.draws > 0 && (
                    <View style={[styles.matchResultBadge, styles.badgeDraw]}>
                      <Text style={styles.badgeDrawText}>{matchStats.draws}E</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.totalGamesText}>
                  {matchStats.totalMatches} partidas registradas
                </Text>
              </View>
            </View>

            {/* Botón para registrar nueva partida */}
            <TouchableOpacity
              style={styles.addMatchBtn}
              onPress={() => setIsRecordMatchModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.addMatchBtnText}>REGISTRAR NUEVA PARTIDA</Text>
            </TouchableOpacity>

            {/* Historial de enfrentamientos */}
            <Text style={styles.matchesListTitle}>HISTORIAL DE ENFRENTAMIENTOS</Text>

            {matches.length === 0 ? (
              <View style={styles.emptyMatchesBox}>
                <Ionicons name="game-controller-outline" size={36} color="#475569" />
                <Text style={styles.emptyMatchesTitle}>Sin partidas registradas</Text>
                <Text style={styles.emptyMatchesText}>
                  Juega con este mazo y registra tus resultados para calcular tu winrate y rendimiento competitivo.
                </Text>
              </View>
            ) : (
              <View style={styles.matchesListContainer}>
                {matches.map(m => (
                  <View key={m.id} style={styles.matchItemCard}>
                    <View
                      style={[
                        styles.matchOutcomeIndicator,
                        m.result === 'win'
                          ? styles.outcomeWin
                          : m.result === 'loss'
                          ? styles.outcomeLoss
                          : styles.outcomeDraw,
                      ]}
                    />

                    <View style={styles.matchItemBody}>
                      <View style={styles.matchItemTop}>
                        <Text style={styles.matchOpponentName}>vs {m.opponentName}</Text>
                        <Text
                          style={[
                            styles.matchScoreText,
                            m.result === 'win'
                              ? styles.scoreWin
                              : m.result === 'loss'
                              ? styles.scoreLoss
                              : styles.scoreDraw,
                          ]}
                        >
                          {m.playerScore} - {m.opponentScore}
                        </Text>
                      </View>

                      {m.opponentChampion && (
                        <Text style={styles.matchOpponentChamp}>
                          Campeón/Mazo: {m.opponentChampion}
                        </Text>
                      )}

                      {m.notes && <Text style={styles.matchNotesText}>"{m.notes}"</Text>}

                      <Text style={styles.matchDateText}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteMatchBtn}
                      onPress={() => {
                        Alert.alert('Eliminar partida', '¿Deseas borrar este registro?', [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Eliminar',
                            style: 'destructive',
                            onPress: async () => {
                              await MatchRepository.deleteMatch(m.id);
                              loadMatches();
                            },
                          },
                        ]);
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Button "Editar el mazo" Fiel a Screenshots 6-9 */}
      <View style={styles.floatingActionContainer}>
        <TouchableOpacity
          style={styles.editDeckButton}
          onPress={() => onEditDeck?.()}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={18} color="#090D14" style={{ marginRight: 8 }} />
          <Text style={styles.editDeckButtonText}>Editar el mazo</Text>
        </TouchableOpacity>
      </View>
      {/* Modales */}
      <ExportDeckModal
        visible={isExportModalOpen}
        deck={deck}
        onClose={() => setIsExportModalOpen(false)}
      />

      <EditDeckModal
        visible={isEditModalOpen}
        deck={deck}
        onClose={() => setIsEditModalOpen(false)}
        onSave={updates => {
          onEditDeck?.(updates);
        }}
      />

      <DeckCollectionAnalysisModal
        visible={isCollectionAnalysisModalOpen}
        deck={deck}
        analysis={collectionAnalysis}
        onClose={() => setIsCollectionAnalysisModalOpen(false)}
      />

      <PublishDeckModal
        visible={isPublishModalOpen}
        deck={deck}
        onClose={() => setIsPublishModalOpen(false)}
      />

      <RecordMatchModal
        visible={isRecordMatchModalOpen}
        deck={deck}
        onClose={() => setIsRecordMatchModalOpen(false)}
        onSave={async data => {
          await MatchRepository.recordMatch(data);
          loadMatches();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D14',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
  },
  iconBtn: {
    padding: 6,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navDeckName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  priceVariationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    marginRight: 6,
  },
  priceVariationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceVariationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#818CF8',
    marginLeft: 3,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E9AA8',
  },
  tabBtnTextActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  viewsBadgeRow: {
    marginBottom: 14,
  },
  viewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#161F30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26334D',
  },
  viewsBadgeText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  legendRunesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  legendBox: {
    flex: 1,
  },
  runesBox: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 10,
  },
  sectionCounter: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  legendCardPreview: {
    backgroundColor: '#0F1522',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  legendImg: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    marginBottom: 8,
  },
  legendName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  legendPrice: {
    fontSize: 11,
    color: '#60A5FA',
    marginTop: 4,
    fontWeight: '600',
  },
  emptySlot: {
    height: 180,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#26334D',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 31, 48, 0.4)',
  },
  emptySlotText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  runesGrid: {
    gap: 10,
  },
  runeSlot: {
    backgroundColor: '#0F1522',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    height: 85,
  },
  runeIconCircle: {
    marginBottom: 4,
  },
  runeCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionBlock: {
    marginBottom: 24,
  },
  battlefieldsRow: {
    flexDirection: 'row',
  },
  battlefieldCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: '#0F1522',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  battlefieldImg: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    marginBottom: 6,
  },
  battlefieldTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  mainDeckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 3,
  },
  subCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 14,
    marginBottom: 10,
  },
  subCategoryCount: {
    color: '#64748B',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCardItem: {
    width: '31%',
    marginBottom: 10,
  },
  cardImageWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    height: 120,
    marginBottom: 4,
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
  },
  costBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  costText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
  },
  mightBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mightText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  countBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    elevation: 3,
  },
  countText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#090D14',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  cardPrice: {
    fontSize: 10,
    color: '#60A5FA',
    marginTop: 2,
  },
  collapsedSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#161F30',
  },
  collapsedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  collapsedCount: {
    color: '#64748B',
  },
  floatingActionContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  editDeckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  editDeckButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#090D14',
  },
  statsTabContent: {
    paddingVertical: 10,
  },
  statsHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  manaCurveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    backgroundColor: '#0F1522',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  manaBarCol: {
    alignItems: 'center',
  },
  manaBarVal: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  manaBarFill: {
    width: 22,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  manaBarCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 6,
  },
  legalityContainer: {
    backgroundColor: '#0F1522',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  legalityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalityText: {
    fontSize: 14,
    color: '#CBD5E1',
    marginLeft: 10,
    fontWeight: '500',
  },
  /* Banner de Colección Física (Opción 2) */
  collectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  collectionBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collectionBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  collectionBannerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  collectionBannerPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  collectionBannerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  /* Insignia de posesión en cada carta */
  cardOwnershipTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 3,
  },
  cardOwnershipTagOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  cardOwnershipTagMissing: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
  },
  cardOwnershipText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardOwnershipTextOk: {
    color: '#FFFFFF',
  },
  cardOwnershipTextMissing: {
    color: '#090D14',
  },
  /* TAB DE PARTIDAS Y WINRATE (Opción 4) */
  matchesTabContent: {
    paddingVertical: 10,
  },
  winrateHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1522',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  winrateHeroLeft: {
    alignItems: 'flex-start',
  },
  winratePercentText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10B981',
  },
  winrateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  winrateHeroRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  winrateBreakdownRow: {
    flexDirection: 'row',
    gap: 6,
  },
  matchResultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeWin: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeLoss: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  badgeDraw: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  badgeWinText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  badgeLossText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  badgeDrawText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  totalGamesText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  addMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  addMatchBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  matchesListTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emptyMatchesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1522',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  emptyMatchesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 6,
  },
  emptyMatchesText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  matchesListContainer: {
    gap: 10,
  },
  matchItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1522',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  matchOutcomeIndicator: {
    width: 4,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  outcomeWin: {
    backgroundColor: '#10B981',
  },
  outcomeLoss: {
    backgroundColor: '#EF4444',
  },
  outcomeDraw: {
    backgroundColor: '#94A3B8',
  },
  matchItemBody: {
    flex: 1,
    marginLeft: 8,
  },
  matchItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchOpponentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  matchScoreText: {
    fontSize: 15,
    fontWeight: '900',
  },
  scoreWin: {
    color: '#10B981',
  },
  scoreLoss: {
    color: '#EF4444',
  },
  scoreDraw: {
    color: '#94A3B8',
  },
  matchOpponentChamp: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  matchNotesText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  matchDateText: {
    fontSize: 10,
    color: '#64748B',
  },
  deleteMatchBtn: {
    padding: 8,
  },
});
