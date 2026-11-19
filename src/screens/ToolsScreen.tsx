import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TradeScreen } from './TradeScreen';
import { MatchScreen } from './MatchScreen';
import { ScannerScreen } from './ScannerScreen';
import { CommunityHubScreen } from './CommunityHubScreen';
import { TournamentScreen } from './TournamentScreen';
import { OracleModal } from '@/components/ai/OracleModal';

export const ToolsScreen: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'hub' | 'trade' | 'match' | 'scanner' | 'community' | 'tournament'>('hub');
  const [isOracleModalOpen, setIsOracleModalOpen] = useState(false);

  if (activeTool === 'tournament') {
    return <TournamentScreen onBack={() => setActiveTool('hub')} />;
  }

  if (activeTool === 'community') {
    return <CommunityHubScreen onBack={() => setActiveTool('hub')} />;
  }

  if (activeTool === 'scanner') {
    return (
      <ScannerScreen
        onBack={() => setActiveTool('hub')}
        onNavigateToTrade={() => setActiveTool('trade')}
      />
    );
  }

  if (activeTool === 'trade') {
    return <TradeScreen onBack={() => setActiveTool('hub')} />;
  }

  if (activeTool === 'match') {
    return <MatchScreen onBack={() => setActiveTool('hub')} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Herramientas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Herramientas de IA, escaneo, juego, cálculo de precios y utilidades para torneos oficiales de Riftbound.
        </Text>

        {/* Tarjeta 0: Oráculo del Nexo con IA de Google Gemini */}
        <TouchableOpacity
          style={[styles.toolCard, styles.aiHighlightCard]}
          onPress={() => setIsOracleModalOpen(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.toolIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
            <Ionicons name="sparkles" size={28} color="#C084FC" />
          </View>
          <View style={styles.toolInfo}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.toolTitle}>Oráculo del Nexo (IA Gemini)</Text>
              <View style={[styles.newBadge, { backgroundColor: '#A855F7' }]}>
                <Text style={[styles.newBadgeText, { color: '#FFFFFF' }]}>IA STUDIO</Text>
              </View>
            </View>
            <Text style={styles.toolDesc}>
              Consulta al asistente táctico impulsado por Google AI Studio. Analiza la consistencia de tus mazos, sinergias y reglas oficiales.
            </Text>
            <View style={[styles.toolBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Text style={[styles.toolBadgeText, { color: '#C084FC' }]}>Google Gemini • Estrategia • Auditor de Mazos</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#C084FC" />
        </TouchableOpacity>

        {/* Tarjeta 1: Escáner de Cartas TCG con Cámara */}
        <TouchableOpacity
          style={[styles.toolCard, styles.scannerHighlightCard]}
          onPress={() => setActiveTool('scanner')}
          activeOpacity={0.85}
        >
          <View style={[styles.toolIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
            <Ionicons name="camera" size={28} color="#3B82F6" />
          </View>
          <View style={styles.toolInfo}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.toolTitle}>Escáner de Cartas con Cámara</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NUEVO</Text>
              </View>
            </View>
            <Text style={styles.toolDesc}>
              Enfoca tus cartas físicas con el visor TCG para añadirlas al instante a tu colección o mazos con coincidencia difusa (Fuzzy Matching).
            </Text>
            <View style={[styles.toolBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={[styles.toolBadgeText, { color: '#10B981' }]}>Modo Continuo + Háptico</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#3B82F6" />
        </TouchableOpacity>

        {/* Tarjeta 1.5: Hub Comunitario & Meta Tier List */}
        <TouchableOpacity
          style={styles.toolCard}
          onPress={() => setActiveTool('community')}
          activeOpacity={0.85}
        >
          <View style={[styles.toolIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
            <Ionicons name="trophy" size={28} color="#FBBF24" />
          </View>
          <View style={styles.toolInfo}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.toolTitle}>Hub Comunitario & Meta Tier</Text>
              <View style={[styles.newBadge, { backgroundColor: '#FBBF24' }]}>
                <Text style={[styles.newBadgeText, { color: '#090D14' }]}>HOT</Text>
              </View>
            </View>
            <Text style={styles.toolDesc}>
              Explora la Meta Tier List oficial, winrates de torneos y clona mazos de otros jugadores con cruce automático a tu colección física.
            </Text>
            <View style={[styles.toolBadge, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
              <Text style={[styles.toolBadgeText, { color: '#FDE047' }]}>Tier S • Cruce Físico • Clon 1-Clic</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#FBBF24" />
        </TouchableOpacity>

        {/* Tarjeta 1.8: Gestor de Torneos Locales */}
        <TouchableOpacity
          style={styles.toolCard}
          onPress={() => setActiveTool('tournament')}
          activeOpacity={0.85}
        >
          <View style={[styles.toolIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="medal" size={28} color="#10B981" />
          </View>
          <View style={styles.toolInfo}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.toolTitle}>Gestor de Torneos Locales</Text>
              <View style={[styles.newBadge, { backgroundColor: '#10B981' }]}>
                <Text style={[styles.newBadgeText, { color: '#090D14' }]}>NUEVO</Text>
              </View>
            </View>
            <Text style={styles.toolDesc}>
              Organiza torneos en Sistema Suizo o Eliminación Directa con cálculo de desempate OMW%, temporizador y podio con exportación.
            </Text>
            <View style={[styles.toolBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={[styles.toolBadgeText, { color: '#10B981' }]}>Suizo (OMW%) • Brackets • 4-16 Jugadores</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#10B981" />
        </TouchableOpacity>

        {/* Tarjeta 2: Ayuda de intercambio */}
        <TouchableOpacity
          style={styles.toolCard}
          onPress={() => setActiveTool('trade')}
          activeOpacity={0.85}
        >
          <View style={[styles.toolIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Ionicons name="swap-horizontal" size={28} color="#3B82F6" />
          </View>
          <View style={styles.toolInfo}>
            <Text style={styles.toolTitle}>Ayuda de Intercambio</Text>
            <Text style={styles.toolDesc}>
              Compara el valor de mercado en tiempo real entre tus cartas y las de otro jugador para asegurar intercambios justos.
            </Text>
            <View style={styles.toolBadge}>
              <Text style={styles.toolBadgeText}>Precios OpenRift Live</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#64748B" />
        </TouchableOpacity>

        {/* Tarjeta 2: Contador de Partida */}
        <TouchableOpacity
          style={styles.toolCard}
          onPress={() => setActiveTool('match')}
          activeOpacity={0.85}
        >
          <View style={[styles.toolIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Ionicons name="game-controller" size={28} color="#EF4444" />
          </View>
          <View style={styles.toolInfo}>
            <Text style={styles.toolTitle}>Contador de Partida</Text>
            <Text style={styles.toolDesc}>
              Seguimiento de puntos a 8 PTS según el reglamento oficial de Riftbound, soporte de 1 a 4 jugadores y contador de XP.
            </Text>
            <View style={[styles.toolBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={[styles.toolBadgeText, { color: '#F87171' }]}>Regla oficial: 8 Pts</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#64748B" />
        </TouchableOpacity>

        {/* Tarjeta 3: Calculadora de Maná y Curva */}
        <View style={[styles.toolCard, { opacity: 0.85 }]}>
          <View style={[styles.toolIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
            <Ionicons name="analytics" size={28} color="#A855F7" />
          </View>
          <View style={styles.toolInfo}>
            <Text style={styles.toolTitle}>Probabilidad de Robo</Text>
            <Text style={styles.toolDesc}>
              Calcula la probabilidad hipergeométrica de robar tu carta clave o campeón en el turno 1 con mazo de 40 cartas.
            </Text>
            <View style={[styles.toolBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Text style={[styles.toolBadgeText, { color: '#C084FC' }]}>Matemáticas TCG</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal del Oráculo de IA de Google Gemini */}
      <OracleModal
        visible={isOracleModalOpen}
        onClose={() => setIsOracleModalOpen(false)}
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E9AA8',
    marginBottom: 20,
    lineHeight: 18,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1522',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  scannerHighlightCard: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: '#0F1A2E',
  },
  aiHighlightCard: {
    borderColor: 'rgba(168, 85, 247, 0.45)',
    backgroundColor: '#150F28',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  newBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  newBadgeText: {
    color: '#60A5FA',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toolIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  toolInfo: {
    flex: 1,
    marginRight: 8,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  toolDesc: {
    fontSize: 12,
    color: '#8E9AA8',
    lineHeight: 16,
    marginBottom: 8,
  },
  toolBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toolBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#60A5FA',
  },
});
