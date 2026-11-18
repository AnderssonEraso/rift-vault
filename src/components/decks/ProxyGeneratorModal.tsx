import React, { useState, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Deck } from '@/types/deck';
import { DeckCollectionAnalysis } from '@/utils/deckCollectionAnalysis';
import {
  ProxyCardItem,
  PaperSize,
  extractDeckProxyItems,
  extractMissingProxyItems,
  expandCardCopies,
  generateProxyPdfFile,
  printProxiesDirectly,
  shareProxyPdf,
} from '@/utils/proxyPdfGenerator';

interface ProxyGeneratorModalProps {
  visible: boolean;
  deck: Deck;
  analysis?: DeckCollectionAnalysis;
  initialMode?: 'missing' | 'all';
  onClose: () => void;
}

export const ProxyGeneratorModal: React.FC<ProxyGeneratorModalProps> = ({
  visible,
  deck,
  analysis,
  initialMode = 'missing',
  onClose,
}) => {
  // Opciones de configuración
  const hasMissingCards = Boolean(analysis && analysis.missingCards.length > 0);
  const [mode, setMode] = useState<'missing' | 'all'>(
    hasMissingCards && initialMode === 'missing' ? 'missing' : 'all'
  );
  const [includeCutLines, setIncludeCutLines] = useState<boolean>(true);
  const [paperSize, setPaperSize] = useState<PaperSize>('letter');

  // Estados de carga y progreso
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<'print' | 'share' | null>(null);

  // Lista de cartas filtrada según el modo seleccionado
  const activeProxyItems = useMemo<ProxyCardItem[]>(() => {
    if (mode === 'missing' && analysis && analysis.missingCards.length > 0) {
      return extractMissingProxyItems(analysis.missingCards, deck);
    }
    return extractDeckProxyItems(deck);
  }, [mode, analysis, deck]);

  // Cálculos de hojas y cartas totales
  const totalCardsCount = useMemo(() => {
    return activeProxyItems.reduce((acc, item) => acc + (item.count || 1), 0);
  }, [activeProxyItems]);

  const totalSheetsCount = Math.max(1, Math.ceil(totalCardsCount / 9));

  // Manejo de Impresión directa
  const handlePrint = async () => {
    if (totalCardsCount === 0) {
      Alert.alert('Sin cartas', 'No hay cartas para generar proxies en esta selección.');
      return;
    }

    try {
      setIsGenerating(true);
      setLoadingAction('print');
      await printProxiesDirectly(activeProxyItems, {
        deckName: deck.name,
        includeCutLines,
        paperSize,
        mode,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al abrir diálogo de impresión';
      Alert.alert('Error al imprimir', msg);
    } finally {
      setIsGenerating(false);
      setLoadingAction(null);
    }
  };

  // Manejo de Generación y Compartir PDF
  const handleSharePdf = async () => {
    if (totalCardsCount === 0) {
      Alert.alert('Sin cartas', 'No hay cartas para generar proxies en esta selección.');
      return;
    }

    try {
      setIsGenerating(true);
      setLoadingAction('share');

      const result = await generateProxyPdfFile(activeProxyItems, {
        deckName: deck.name,
        includeCutLines,
        paperSize,
        mode,
      });

      const shared = await shareProxyPdf(
        result.uri,
        `Proxies - ${deck.name} (${result.totalCards} cartas)`
      );

      if (!shared && Platform.OS !== 'web') {
        Alert.alert(
          'PDF Generado',
          `Archivo guardado temporalmente en: ${result.uri}. El sistema de compartir no está disponible en este dispositivo.`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar el archivo PDF';
      Alert.alert('Error al exportar PDF', msg);
    } finally {
      setIsGenerating(false);
      setLoadingAction(null);
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
              <Ionicons name="print-outline" size={24} color={deck.color || '#3B82F6'} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Generador de Proxies TCG</Text>
              <Text style={styles.subtitle}>{deck.name} • Tamaño Oficial (63x88mm)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Tarjeta Resumen: Páginas e Impresión */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricVal}>{totalCardsCount}</Text>
              <Text style={styles.metricLabel}>Cartas Proxy</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.summaryMetric}>
              <Text style={[styles.metricVal, { color: '#38BDF8' }]}>
                {totalSheetsCount}
              </Text>
              <Text style={styles.metricLabel}>
                {totalSheetsCount === 1 ? 'Hoja (3x3)' : 'Hojas (3x3)'}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.summaryMetric}>
              <Text style={[styles.metricVal, { color: '#10B981' }]}>100%</Text>
              <Text style={styles.metricLabel}>Escala Real</Text>
            </View>
          </View>

          {/* Selector de Modo: Solo faltantes vs Mazo completo */}
          {hasMissingCards && (
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'missing' && styles.modeTabActive]}
                onPress={() => setMode('missing')}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={mode === 'missing' ? '#EF4444' : '#94A3B8'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    mode === 'missing' && styles.modeTabTextActive,
                  ]}
                >
                  Solo Faltantes ({analysis?.missingCards.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, mode === 'all' && styles.modeTabActive]}
                onPress={() => setMode('all')}
              >
                <Ionicons
                  name="albums-outline"
                  size={16}
                  color={mode === 'all' ? '#3B82F6' : '#94A3B8'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    mode === 'all' && styles.modeTabTextActive,
                  ]}
                >
                  Mazo Completo
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Opciones de Impresión: Marcas de corte y tamaño de papel */}
          <View style={styles.settingsBox}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelBox}>
                <Ionicons name="cut-outline" size={18} color="#94A3B8" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.settingTitle}>Líneas de corte (Cut marks)</Text>
                  <Text style={styles.settingSubtitle}>
                    Guías punteadas para cortar fácilmente con regla o tijera
                  </Text>
                </View>
              </View>
              <Switch
                value={includeCutLines}
                onValueChange={setIncludeCutLines}
                trackColor={{ false: '#334155', true: '#2563EB' }}
                thumbColor={includeCutLines ? '#FFFFFF' : '#94A3B8'}
              />
            </View>

            <View style={[styles.settingRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1E293B' }]}>
              <View style={styles.settingLabelBox}>
                <Ionicons name="document-text-outline" size={18} color="#94A3B8" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.settingTitle}>Tamaño de papel</Text>
                  <Text style={styles.settingSubtitle}>
                    {paperSize === 'letter' ? 'Carta EE.UU. (8.5 × 11 in)' : 'A4 Estándar (210 × 297 mm)'}
                  </Text>
                </View>
              </View>
              <View style={styles.paperSizePills}>
                <TouchableOpacity
                  style={[styles.paperSizePill, paperSize === 'letter' && styles.paperSizePillActive]}
                  onPress={() => setPaperSize('letter')}
                >
                  <Text style={[styles.paperSizePillText, paperSize === 'letter' && styles.paperSizePillTextActive]}>
                    Carta
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.paperSizePill, paperSize === 'a4' && styles.paperSizePillActive]}
                  onPress={() => setPaperSize('a4')}
                >
                  <Text style={[styles.paperSizePillText, paperSize === 'a4' && styles.paperSizePillTextActive]}>
                    A4
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Lista desglosada de cartas que se van a generar */}
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderText}>
              DESGLOSE DE PROXIES ({activeProxyItems.length} tipos de cartas)
            </Text>
            <Text style={styles.listHeaderSub}>9 cartas por hoja</Text>
          </View>

          <ScrollView style={styles.cardsScroll} showsVerticalScrollIndicator={false}>
            {activeProxyItems.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.cardItemRow}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.cardThumb} />
                ) : (
                  <View style={styles.cardThumbPlaceholder}>
                    <Ionicons name="image-outline" size={16} color="#64748B" />
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {item.section || 'Carta'} • {item.primaryDomain || 'Rift'}
                  </Text>
                </View>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>×{item.count}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Mensaje de escala */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#38BDF8" />
            <Text style={styles.infoBannerText}>
              Configura tu impresora al <Text style={{ fontWeight: '700', color: '#F8FAFC' }}>100% de escala</Text> (sin "Ajustar a página") para que las cartas midan exactamente 63 × 88 mm y calcen en tus micas/sleeves.
            </Text>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.printBtn]}
              onPress={handlePrint}
              disabled={isGenerating}
              activeOpacity={0.8}
            >
              {isGenerating && loadingAction === 'print' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="print" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>Imprimir</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.shareBtn]}
              onPress={handleSharePdf}
              disabled={isGenerating}
              activeOpacity={0.8}
            >
              {isGenerating && loadingAction === 'share' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="share-social" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>Compartir PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
    flexDirection: 'row',
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1E293B',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#090D14',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#1E293B',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modeTabTextActive: {
    color: '#F8FAFC',
  },
  settingsBox: {
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  settingSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  paperSizePills: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 2,
  },
  paperSizePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  paperSizePillActive: {
    backgroundColor: '#3B82F6',
  },
  paperSizePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  paperSizePillTextActive: {
    color: '#FFFFFF',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  listHeaderSub: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '500',
  },
  cardsScroll: {
    maxHeight: 150,
    marginBottom: 12,
  },
  cardItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
  },
  cardThumb: {
    width: 28,
    height: 38,
    borderRadius: 4,
    backgroundColor: '#1E293B',
  },
  cardThumbPlaceholder: {
    width: 28,
    height: 38,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  cardMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 14,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  printBtn: {
    backgroundColor: '#334155',
  },
  shareBtn: {
    backgroundColor: '#2563EB',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
