import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MetaTierItem, DeckTier } from '@/types/community';

interface MetaTierListViewProps {
  items: MetaTierItem[];
  onExploreArchetype?: (item: MetaTierItem) => void;
}

export const MetaTierListView: React.FC<MetaTierListViewProps> = ({
  items,
  onExploreArchetype,
}) => {
  const tiers: DeckTier[] = ['S', 'A', 'B'];

  const getTierBadgeStyle = (tier: DeckTier) => {
    switch (tier) {
      case 'S':
        return {
          bg: 'rgba(234, 179, 8, 0.15)',
          border: '#EAB308',
          text: '#FDE047',
          label: 'Tier S • Dominantes del Meta',
        };
      case 'A':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          border: '#38BDF8',
          text: '#7DD3FC',
          label: 'Tier A • Competitivo Sólido',
        };
      case 'B':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '#10B981',
          text: '#6EE7B7',
          label: 'Tier B • Viable / Anti-Meta',
        };
      default:
        return {
          bg: 'rgba(100, 116, 139, 0.15)',
          border: '#64748B',
          text: '#CBD5E1',
          label: 'Tier C • Rogue / Experimental',
        };
    }
  };

  const getDomainColor = (domain?: string) => {
    switch (domain?.toLowerCase()) {
      case 'fury':
        return '#EF4444';
      case 'calm':
        return '#38BDF8';
      case 'mind':
        return '#A855F7';
      case 'body':
        return '#10B981';
      case 'chaos':
        return '#F59E0B';
      default:
        return '#E2E8F0';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Banner Informativo del Meta */}
      <View style={styles.metaHeaderBanner}>
        <View style={styles.metaIconCircle}>
          <Ionicons name="trophy" size={24} color="#FBBF24" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.metaHeaderTitle}>Meta Tier List Oficial</Text>
          <Text style={styles.metaHeaderSubtitle}>
            Basado en estadísticas de torneos competitivos de Riftbound TCG, winrate global y porcentaje de presencia en juego.
          </Text>
        </View>
      </View>

      {/* Secciones por Tier */}
      {tiers.map(tier => {
        const tierItems = items.filter(i => i.tier === tier);
        if (tierItems.length === 0) return null;
        const style = getTierBadgeStyle(tier);

        return (
          <View key={tier} style={styles.tierSection}>
            {/* Cabecera del Tier */}
            <View style={[styles.tierHeaderRow, { backgroundColor: style.bg, borderColor: style.border }]}>
              <View style={[styles.tierPill, { backgroundColor: style.border }]}>
                <Text style={styles.tierPillText}>{tier}</Text>
              </View>
              <Text style={[styles.tierHeaderText, { color: style.text }]}>{style.label}</Text>
            </View>

            {/* Lista de Arquetipos en este Tier */}
            {tierItems.map(item => {
              const domColor = getDomainColor(item.primaryDomain);
              const winrateColor =
                item.winratePercent >= 55
                  ? '#10B981'
                  : item.winratePercent >= 51
                  ? '#38BDF8'
                  : '#F59E0B';

              return (
                <View key={item.id} style={styles.archetypeCard}>
                  <View style={styles.archetypeTopRow}>
                    {/* Imagen de Leyenda del Arquetipo */}
                    {item.legendImageUrl ? (
                      <Image source={{ uri: item.legendImageUrl }} style={styles.legendImg} />
                    ) : (
                      <View style={[styles.legendPlaceholder, { borderColor: domColor }]}>
                        <Ionicons name="shield" size={24} color={domColor} />
                      </View>
                    )}

                    <View style={styles.archetypeInfo}>
                      <View style={styles.titlePlaystyleRow}>
                        <Text style={styles.archetypeName} numberOfLines={1}>
                          {item.archetypeName}
                        </Text>
                      </View>

                      <View style={styles.legendDomainRow}>
                        <View style={[styles.domainDot, { backgroundColor: domColor }]} />
                        <Text style={styles.legendNameText}>
                          {item.legendName} • {item.primaryDomain.toUpperCase()}
                        </Text>
                      </View>

                      {/* Métricas: Winrate y Popularidad */}
                      <View style={styles.metricsRow}>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>Winrate</Text>
                          <Text style={[styles.metricValue, { color: winrateColor }]}>
                            {item.winratePercent.toFixed(1)}%
                          </Text>
                        </View>

                        <View style={styles.metricDivider} />

                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>Presencia Meta</Text>
                          <Text style={styles.metricValue}>
                            {item.popularityPercent.toFixed(1)}%
                          </Text>
                        </View>

                        {item.playstyle ? (
                          <>
                            <View style={styles.metricDivider} />
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Estilo</Text>
                              <Text style={[styles.metricValue, { color: '#94A3B8', fontSize: 11 }]}>
                                {item.playstyle}
                              </Text>
                            </View>
                          </>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Descripción o Guía Estratégica */}
                  {item.description ? (
                    <Text style={styles.archetypeDesc}>{item.description}</Text>
                  ) : null}

                  {/* Cartas Clave del Arquetipo */}
                  {item.keyCards && item.keyCards.length > 0 && (
                    <View style={styles.keyCardsRow}>
                      <Text style={styles.keyCardsLabel}>Cartas clave:</Text>
                      {item.keyCards.map((cardName, idx) => (
                        <View key={idx} style={styles.keyCardPill}>
                          <Text style={styles.keyCardText}>{cardName}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Botón para ver mazos comunitarios de este arquetipo */}
                  <TouchableOpacity
                    style={styles.exploreDecksBtn}
                    onPress={() => onExploreArchetype?.(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="search-outline" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
                    <Text style={styles.exploreDecksText}>
                      Explorar mazos de {item.legendName.split(',')[0]}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#38BDF8" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    paddingTop: 8,
  },
  metaHeaderBanner: {
    flexDirection: 'row',
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  metaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  metaHeaderSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
    marginTop: 2,
  },
  tierSection: {
    marginBottom: 18,
  },
  tierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  tierPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#090D14',
  },
  tierHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  archetypeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    marginBottom: 10,
  },
  archetypeTopRow: {
    flexDirection: 'row',
  },
  legendImg: {
    width: 55,
    height: 75,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  legendPlaceholder: {
    width: 55,
    height: 75,
    borderRadius: 6,
    backgroundColor: '#090D14',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  archetypeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titlePlaystyleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  archetypeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  legendDomainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 5,
  },
  domainDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendNameText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#090D14',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#1E293B',
  },
  archetypeDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: 10,
  },
  keyCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  keyCardsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  keyCardPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  keyCardText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  exploreDecksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
  },
  exploreDecksText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
