import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MatchPlayer, MatchSettings, RiftMatch } from '@/types/match';
import { useAuth } from '@/context/AuthContext';

const INITIAL_CHAMPIONS = [
  { name: 'Shen, Eye of Twilight', image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Shen_0.jpg', color: '#0AC8B9' },
  { name: 'Zed, Master of Shadows', image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Zed_0.jpg', color: '#EF4444' },
  { name: 'Vi, Piltover Enforcer', image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Vi_0.jpg', color: '#F59E0B' },
  { name: 'Seraphine, Songstress', image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Seraphine_0.jpg', color: '#EC4899' },
];

interface MatchScreenProps {
  onBack?: () => void;
}

export const MatchScreen: React.FC<MatchScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  // Configuración de la partida
  const [playerMode, setPlayerMode] = useState<1 | 2 | 3 | 4>(2);
  const [maxPoints, setMaxPoints] = useState<number>(8); // Por regla de Riftbound: 8 puntos
  const [enableXpCounter, setEnableXpCounter] = useState<boolean>(true);

  // Estado de los jugadores configurados
  const [players, setPlayers] = useState<MatchPlayer[]>([
    {
      id: 'p1',
      name: user?.username || 'Jugador 1',
      championName: INITIAL_CHAMPIONS[0].name,
      championImage: INITIAL_CHAMPIONS[0].image,
      score: 0,
      xp: 0,
      color: INITIAL_CHAMPIONS[0].color,
      isWinner: false,
    },
    {
      id: 'p2',
      name: 'Jugador 2',
      championName: INITIAL_CHAMPIONS[1].name,
      championImage: INITIAL_CHAMPIONS[1].image,
      score: 0,
      xp: 0,
      color: INITIAL_CHAMPIONS[1].color,
      isWinner: false,
    },
  ]);

  // Edición de nombres en el setup
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [tempPlayerName, setTempPlayerName] = useState<string>('');

  // Estado del juego en vivo
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [winner, setWinner] = useState<MatchPlayer | null>(null);

  // Cambiar modo de jugadores
  const handleSelectMode = (count: 1 | 2 | 3 | 4) => {
    setPlayerMode(count);
    const newPlayers: MatchPlayer[] = [];
    for (let i = 0; i < count; i++) {
      const champ = INITIAL_CHAMPIONS[i % INITIAL_CHAMPIONS.length];
      newPlayers.push({
        id: `p${i + 1}`,
        name: `Jugador ${i + 1}`,
        championName: champ.name,
        championImage: champ.image,
        score: 0,
        xp: 0,
        color: champ.color,
        isWinner: false,
      });
    }
    setPlayers(newPlayers);
  };

  // Restablecer jugadores
  const handleResetPlayers = () => {
    handleSelectMode(playerMode);
    setMaxPoints(8);
    setEnableXpCounter(true);
  };

  // Alternar campeón de un jugador
  const handleCycleChampion = (playerId: string) => {
    setPlayers(prev =>
      prev.map(p => {
        if (p.id !== playerId) return p;
        const currentIdx = INITIAL_CHAMPIONS.findIndex(c => c.image === p.championImage);
        const nextIdx = (currentIdx + 1) % INITIAL_CHAMPIONS.length;
        const nextChamp = INITIAL_CHAMPIONS[nextIdx];
        return {
          ...p,
          championName: nextChamp.name,
          championImage: nextChamp.image,
          color: nextChamp.color,
        };
      })
    );
  };

  // Iniciar partida
  const handleStartMatch = () => {
    setWinner(null);
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, xp: 0, isWinner: false })));
    setIsPlaying(true);
  };

  // Modificar puntos en vivo
  const handleDeltaScore = (playerId: string, delta: number) => {
    setPlayers(prev =>
      prev.map(p => {
        if (p.id !== playerId) return p;
        const newScore = Math.max(0, p.score + delta);
        const won = newScore >= maxPoints;
        if (won && !winner) {
          setWinner({ ...p, score: newScore, isWinner: true });
        }
        return {
          ...p,
          score: newScore,
          isWinner: won,
        };
      })
    );
  };

  // Modificar XP en vivo
  const handleDeltaXp = (playerId: string, delta: number) => {
    setPlayers(prev =>
      prev.map(p => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          xp: Math.max(0, p.xp + delta),
        };
      })
    );
  };

  // --------------------------------------------------------------------------
  // VISTA DE PARTIDA EN VIVO (TABLERO INTERACTIVO)
  // --------------------------------------------------------------------------
  if (isPlaying) {
    return (
      <View style={styles.liveContainer}>
        {/* Header en vivo */}
        <View style={styles.liveHeader}>
          <TouchableOpacity onPress={() => setIsPlaying(false)} style={styles.exitLiveBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            <Text style={styles.exitLiveText}>Salir</Text>
          </TouchableOpacity>
          <View style={styles.goalBadge}>
            <Text style={styles.goalBadgeText}>Meta: {maxPoints} Pts</Text>
          </View>
          <TouchableOpacity onPress={handleStartMatch} style={styles.restartLiveBtn}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tablero de jugadores */}
        <View style={styles.liveGrid}>
          {players.map(player => (
            <View
              key={player.id}
              style={[
                styles.livePlayerZone,
                playerMode === 2 && styles.livePlayerZoneHalf,
                { borderColor: player.color },
              ]}
            >
              <Image source={{ uri: player.championImage }} style={styles.liveBgImage} />
              <View style={styles.liveDimmer} />

              <View style={styles.liveContent}>
                <Text style={styles.livePlayerName}>{player.name}</Text>
                <Text style={styles.liveChampName}>{player.championName}</Text>

                {/* Marcador de Puntos gigante */}
                <View style={styles.liveScoreBox}>
                  <TouchableOpacity
                    style={styles.scoreBtn}
                    onPress={() => handleDeltaScore(player.id, -1)}
                  >
                    <Ionicons name="remove" size={32} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={styles.scoreNumberBox}>
                    <Text style={styles.scoreNumber}>{player.score}</Text>
                    <Text style={styles.scoreSubtext}>/ {maxPoints} PTS</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.scoreBtn, styles.scoreBtnPlus]}
                    onPress={() => handleDeltaScore(player.id, 1)}
                  >
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Contador de XP si está activado */}
                {enableXpCounter && (
                  <View style={styles.liveXpRow}>
                    <Text style={styles.liveXpLabel}>XP:</Text>
                    <TouchableOpacity
                      onPress={() => handleDeltaXp(player.id, -1)}
                      style={styles.xpBtn}
                    >
                      <Ionicons name="remove" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                    <Text style={styles.liveXpVal}>{player.xp}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeltaXp(player.id, 1)}
                      style={styles.xpBtn}
                    >
                      <Ionicons name="add" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Overlay de Victoria cuando se alcanzan los 8 puntos */}
        {winner && (
          <View style={styles.winnerOverlay}>
            <View style={styles.winnerCard}>
              <Ionicons name="trophy" size={56} color="#FBBF24" />
              <Text style={styles.winnerTitle}>¡VICTORIA!</Text>
              <Text style={styles.winnerSubtitle}>
                {winner.name} ha alcanzado los {maxPoints} puntos reglamentarios
              </Text>
              <TouchableOpacity
                style={styles.playAgainBtn}
                onPress={handleStartMatch}
              >
                <Text style={styles.playAgainBtnText}>Jugar Otra Partida</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backToSetupBtn}
                onPress={() => setIsPlaying(false)}
              >
                <Text style={styles.backToSetupText}>Volver a Configuración</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // VISTA DE CONFIGURACIÓN (SETUP) FIEL A SCREENSHOT 4
  // --------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Header Fiel a Screenshot 4 */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Crear una partida</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Selector de Jugadores: [2] [Solo] [3] [4] Fiel a Screenshot 4 */}
        <View style={styles.modeChipsContainer}>
          {([2, 1, 3, 4] as (1 | 2 | 3 | 4)[]).map(mode => {
            const isSelected = playerMode === mode;
            const label = mode === 1 ? 'Solo' : `${mode}`;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.modeChip, isSelected && styles.modeChipSelected]}
                onPress={() => handleSelectMode(mode)}
              >
                <Ionicons
                  name={mode === 1 ? 'person-outline' : 'people-outline'}
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#8E9AA8'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.modeChipText, isSelected && styles.modeChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sección Jugadores Fiel a Screenshot 4 */}
        <Text style={styles.sectionHeaderTitle}>Jugadores</Text>

        {players.map((player, index) => (
          <View key={player.id} style={styles.playerCardRow}>
            {/* Tarjeta de campeón vertical */}
            <TouchableOpacity
              onPress={() => handleCycleChampion(player.id)}
              style={styles.champCardPreview}
              activeOpacity={0.8}
            >
              <Image source={{ uri: player.championImage }} style={styles.champImg} />
              <View style={styles.champBadge}>
                <Ionicons name="swap-horizontal" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Nombre del jugador editable */}
            <View style={styles.playerInfoBox}>
              {editingPlayerId === player.id ? (
                <View style={styles.editNameRow}>
                  <TextInput
                    style={styles.editNameInput}
                    value={tempPlayerName}
                    onChangeText={setTempPlayerName}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.saveNameBtn}
                    onPress={() => {
                      if (tempPlayerName.trim()) {
                        setPlayers(prev =>
                          prev.map(p => (p.id === player.id ? { ...p, name: tempPlayerName.trim() } : p))
                        );
                      }
                      setEditingPlayerId(null);
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.playerNameTouchable}
                  onPress={() => {
                    setEditingPlayerId(player.id);
                    setTempPlayerName(player.name);
                  }}
                >
                  <Text style={styles.playerNameText}>{player.name}</Text>
                  <Ionicons name="create-outline" size={16} color="#8E9AA8" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              )}
              <Text style={styles.playerChampSubtitle} numberOfLines={1}>
                {player.championName}
              </Text>
            </View>

            {/* Switch / Toggle derecho fiel a Screenshot 4 */}
            <View style={styles.playerSwitchBox}>
              <View style={styles.whiteIndicatorPill} />
            </View>
          </View>
        ))}

        {/* Sección Opciones avanzadas Fiel a Screenshot 4 */}
        <Text style={styles.sectionHeaderTitle}>Opciones avanzadas</Text>

        <View style={styles.advancedBox}>
          {/* Puntos máx. - 8 + */}
          <View style={styles.advancedRow}>
            <Text style={styles.advancedLabel}>Puntos máx.</Text>
            <View style={styles.numberStepper}>
              <TouchableOpacity
                onPress={() => setMaxPoints(prev => Math.max(1, prev - 1))}
                style={styles.stepBtn}
              >
                <Ionicons name="remove" size={16} color="#CBD5E1" />
              </TouchableOpacity>
              <Text style={styles.stepValue}>{maxPoints}</Text>
              <TouchableOpacity
                onPress={() => setMaxPoints(prev => prev + 1)}
                style={styles.stepBtn}
              >
                <Ionicons name="add" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Contador de XP Switch */}
          <View style={styles.advancedRow}>
            <Text style={styles.advancedLabel}>Contador de XP</Text>
            <Switch
              value={enableXpCounter}
              onValueChange={setEnableXpCounter}
              trackColor={{ false: '#334155', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Botón azul "Empezar la partida" Fiel a Screenshot 4 */}
        <TouchableOpacity
          style={styles.startMatchBtn}
          onPress={handleStartMatch}
          activeOpacity={0.85}
        >
          <Text style={styles.startMatchBtnText}>Empezar la partida</Text>
        </TouchableOpacity>

        {/* Botón "Restablecer jugadores" Fiel a Screenshot 4 */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetPlayers}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={16} color="#8E9AA8" style={{ marginRight: 6 }} />
          <Text style={styles.resetBtnText}>Restablecer jugadores</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  modeChipsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F1522',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  modeChipSelected: {
    backgroundColor: '#26334D',
  },
  modeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E9AA8',
  },
  modeChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
  },
  playerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1522',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  champCardPreview: {
    width: 60,
    height: 84,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
    marginRight: 14,
  },
  champImg: {
    width: '100%',
    height: '100%',
  },
  champBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 3,
  },
  playerInfoBox: {
    flex: 1,
  },
  playerNameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerNameText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  playerChampSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editNameInput: {
    flex: 1,
    backgroundColor: '#161F30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  saveNameBtn: {
    marginLeft: 6,
    backgroundColor: '#2563EB',
    padding: 6,
    borderRadius: 8,
  },
  playerSwitchBox: {
    paddingLeft: 8,
  },
  whiteIndicatorPill: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  advancedBox: {
    backgroundColor: '#0F1522',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  advancedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  advancedLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  numberStepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#161F30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#26334D',
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginHorizontal: 14,
  },
  startMatchBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  startMatchBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  resetBtnText: {
    fontSize: 13,
    color: '#8E9AA8',
    fontWeight: '500',
  },

  // Live Screen Styles
  liveContainer: {
    flex: 1,
    backgroundColor: '#090D14',
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F1522',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  exitLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exitLiveText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  goalBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  goalBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60A5FA',
  },
  restartLiveBtn: {
    padding: 6,
  },
  liveGrid: {
    flex: 1,
    flexDirection: 'column',
  },
  livePlayerZone: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 2,
  },
  livePlayerZoneHalf: {
    flex: 1,
  },
  liveBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  liveDimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 13, 20, 0.75)',
  },
  liveContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  livePlayerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveChampName: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
  },
  liveScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBtnPlus: {
    backgroundColor: '#2563EB',
  },
  scoreNumberBox: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 70,
  },
  scoreSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  liveXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(15, 21, 34, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  liveXpLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60A5FA',
    marginRight: 8,
  },
  xpBtn: {
    padding: 4,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  liveXpVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginHorizontal: 10,
  },
  winnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  winnerCard: {
    backgroundColor: '#0F1522',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  winnerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FBBF24',
    marginTop: 12,
    letterSpacing: 1,
  },
  winnerSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  playAgainBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  playAgainBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  backToSetupBtn: {
    paddingVertical: 10,
  },
  backToSetupText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
