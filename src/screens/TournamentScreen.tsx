import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Share,
  Platform,
  Vibration,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  TournamentFormat,
  Player,
  TournamentMatch,
  TournamentRound,
  TournamentState,
  calculateRecommendedRounds,
  calculateStandings,
  generateSwissRound,
  generateEliminationRound,
  TournamentRepository,
  formatTournamentResultsText,
} from '@/utils/tournamentEngine';

interface TournamentScreenProps {
  onBack?: () => void;
}

export const TournamentScreen: React.FC<TournamentScreenProps> = ({ onBack }) => {
  // Estado del torneo
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Paso 1: Configuración
  const [tournamentName, setTournamentName] = useState('Torneo Semanal Nexus');
  const [format, setFormat] = useState<TournamentFormat>('swiss');
  const [roundDuration, setRoundDuration] = useState<number>(45);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'Carlos (Vi Aggro)' },
    { id: 'p2', name: 'Elena (Zed Sombras)' },
    { id: 'p3', name: 'Marcos (Ahri Control)' },
    { id: 'p4', name: 'David (Garen Order)' },
  ]);

  // Paso 2: Rondas en vivo & Temporizador
  const [secondsLeft, setSecondsLeft] = useState<number>(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'matches' | 'standings'>('matches');

  // Cargar torneo guardado en AsyncStorage al montar
  useEffect(() => {
    const loadSavedTournament = async () => {
      try {
        const saved = await TournamentRepository.getActiveTournament();
        if (saved && saved.status !== 'setup') {
          setTournament(saved);
          setRoundDuration(saved.roundDurationMinutes);
          setSecondsLeft(saved.roundDurationMinutes * 60);
        }
      } catch (e) {
        console.warn('Error cargando torneo activo:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedTournament();
  }, []);

  // Guardar estado cada vez que cambie el torneo activo
  useEffect(() => {
    if (tournament && tournament.status !== 'setup') {
      TournamentRepository.saveActiveTournament(tournament);
    }
  }, [tournament]);

  // Efecto del Temporizador regresivo
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            if (Platform.OS !== 'web') {
              Vibration.vibrate([0, 500, 200, 500]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            }
            Alert.alert(
              '¡TIEMPO AGOTADO!',
              'El tiempo de la ronda ha terminado. Comienzan los 5 turnos adicionales de desempate.'
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Acciones de gestión de jugadores (Paso 1)
  const handleAddPlayer = () => {
    const name = playerNameInput.trim();
    if (!name) return;
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Nombre duplicado', 'Ya existe un participante con ese nombre.');
      return;
    }
    if (players.length >= 16) {
      Alert.alert('Límite alcanzado', 'El gestor local admite un máximo de 16 jugadores.');
      return;
    }

    setPlayers(prev => [
      ...prev,
      { id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`, name },
    ]);
    setPlayerNameInput('');
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const handlePreset8Players = () => {
    setPlayers([
      { id: 'p1', name: 'Carlos (Vi)' },
      { id: 'p2', name: 'Elena (Zed)' },
      { id: 'p3', name: 'Marcos (Ahri)' },
      { id: 'p4', name: 'David (Garen)' },
      { id: 'p5', name: 'Lucía (Aatrox)' },
      { id: 'p6', name: 'Javier (Malphite)' },
      { id: 'p7', name: 'Sara (Jinx)' },
      { id: 'p8', name: 'Pablo (Yasuo)' },
    ]);
  };

  // Iniciar Torneo (Genera Ronda 1)
  const handleStartTournament = () => {
    if (players.length < 4) {
      Alert.alert('Participantes insuficientes', 'Se requieren al menos 4 jugadores para iniciar un torneo.');
      return;
    }

    const totalRounds = calculateRecommendedRounds(players.length, format);
    let round1: TournamentRound;

    if (format === 'swiss') {
      round1 = generateSwissRound(players, [], 1, roundDuration);
    } else {
      round1 = generateEliminationRound(players, [], 1, roundDuration);
    }

    const newTournament: TournamentState = {
      id: `tourney-${Date.now()}`,
      name: tournamentName.trim() || 'Torneo Riftbound',
      format,
      roundDurationMinutes: roundDuration,
      players,
      totalRounds,
      currentRoundNumber: 1,
      rounds: [round1],
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTournament(newTournament);
    setSecondsLeft(roundDuration * 60);
    setIsTimerRunning(true);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  // Registro de Marcadores (Paso 2)
  const handleReportMatch = (matchId: string, p1Score: number, p2Score: number, isDraw = false) => {
    if (!tournament) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    setTournament(prev => {
      if (!prev) return null;
      const currentRound = prev.rounds[prev.currentRoundNumber - 1];
      if (!currentRound) return prev;

      const updatedMatches = currentRound.matches.map(m => {
        if (m.id !== matchId) return m;

        let winnerId: string | 'draw' | undefined = undefined;
        if (isDraw || p1Score === p2Score) {
          winnerId = 'draw';
        } else if (p1Score > p2Score) {
          winnerId = m.player1.id;
        } else {
          winnerId = m.player2?.id;
        }

        return {
          ...m,
          result: {
            player1Score: p1Score,
            player2Score: p2Score,
            isDraw: isDraw || p1Score === p2Score,
            reported: true,
            winnerId,
          },
          isFinished: true,
        };
      });

      const updatedRounds = [...prev.rounds];
      updatedRounds[prev.currentRoundNumber - 1] = {
        ...currentRound,
        matches: updatedMatches,
      };

      return {
        ...prev,
        rounds: updatedRounds,
      };
    });
  };

  // Avanzar a la siguiente ronda o finalizar torneo
  const currentRound = tournament ? tournament.rounds[tournament.currentRoundNumber - 1] : null;
  const allMatchesFinished = currentRound?.matches.every(m => m.isFinished || m.result.reported) ?? false;

  const handleNextRound = () => {
    if (!tournament || !currentRound) return;

    if (!allMatchesFinished) {
      Alert.alert(
        'Partidas pendientes',
        'Hay mesas con resultados sin reportar. Registra todos los marcadores antes de cerrar la ronda.'
      );
      return;
    }

    const nextRoundNumber = tournament.currentRoundNumber + 1;

    // Si era la última ronda, finalizar torneo
    if (nextRoundNumber > tournament.totalRounds) {
      handleFinishTournament();
      return;
    }

    // Generar siguiente ronda
    let nextRound: TournamentRound;
    if (tournament.format === 'swiss') {
      nextRound = generateSwissRound(
        tournament.players,
        tournament.rounds,
        nextRoundNumber,
        tournament.roundDurationMinutes
      );
    } else {
      nextRound = generateEliminationRound(
        tournament.players,
        tournament.rounds,
        nextRoundNumber,
        tournament.roundDurationMinutes
      );
    }

    const updatedRounds = [...tournament.rounds];
    updatedRounds[tournament.currentRoundNumber - 1].isCompleted = true;
    updatedRounds.push(nextRound);

    setTournament({
      ...tournament,
      currentRoundNumber: nextRoundNumber,
      rounds: updatedRounds,
    });

    setSecondsLeft(tournament.roundDurationMinutes * 60);
    setIsTimerRunning(true);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  // Finalizar torneo y coronar campeón
  const handleFinishTournament = () => {
    if (!tournament) return;

    const standings = calculateStandings(tournament.players, tournament.rounds);
    const champion = standings[0]?.player;

    const completedTournament: TournamentState = {
      ...tournament,
      status: 'completed',
      champion,
      podium: {
        first: standings[0]?.player,
        second: standings[1]?.player,
        third: standings[2]?.player,
      },
      updatedAt: new Date().toISOString(),
    };

    setTournament(completedTournament);
    TournamentRepository.archiveTournament(completedTournament);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  // Compartir resultados
  const handleShareResults = async () => {
    if (!tournament) return;
    const text = formatTournamentResultsText(tournament);
    try {
      await Share.share({
        title: `Resultados: ${tournament.name}`,
        message: text,
      });
    } catch {
      // Ignorar
    }
  };

  // Reiniciar o crear nuevo torneo
  const handleResetTournament = () => {
    Alert.alert(
      '¿Comenzar nuevo torneo?',
      'Esta acción cerrará el torneo actual y abrirá la pantalla de configuración.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Nuevo Torneo',
          style: 'destructive',
          onPress: async () => {
            await TournamentRepository.clearActiveTournament();
            setTournament(null);
            setIsTimerRunning(false);
          },
        },
      ]
    );
  };

  // Clasificación actual calculada
  const currentStandings = useMemo(() => {
    if (!tournament) return [];
    return calculateStandings(tournament.players, tournament.rounds);
  }, [tournament]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Gestor de Torneos</Text>
          <Text style={styles.headerSubtitle}>
            {tournament?.status === 'in_progress'
              ? `${tournament.name} • ${tournament.format === 'swiss' ? 'Suizo' : 'Eliminación'}`
              : 'Sistema Suizo & Eliminación Directa'}
          </Text>
        </View>

        {tournament && tournament.status !== 'setup' && (
          <TouchableOpacity onPress={handleResetTournament} style={styles.resetBtn}>
            <Ionicons name="refresh" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ======================================================== */}
      {/* VISTA 1: CONFIGURACIÓN DEL TORNEO                         */}
      {/* ======================================================== */}
      {(!tournament || tournament.status === 'setup') && (
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.setupContainer} showsVerticalScrollIndicator={false}>
          {/* Banner de inicio */}
          <View style={styles.bannerBox}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="trophy" size={24} color="#F59E0B" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.bannerTitle}>Organizador Oficial de Torneos</Text>
              <Text style={styles.bannerSub}>
                Emparejamientos automáticos, desempate OMW% y cronómetro oficial con aviso de turnos extra.
              </Text>
            </View>
          </View>

          {/* Nombre del torneo */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre del Torneo / Evento</Text>
            <TextInput
              style={styles.input}
              value={tournamentName}
              onChangeText={setTournamentName}
              placeholder="Ej. Torneo Local Riftbound #1"
              placeholderTextColor="#64748B"
            />
          </View>

          {/* Formato: Suizo vs Eliminación Directa */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Formato de Juego</Text>
            <View style={styles.formatTabs}>
              <TouchableOpacity
                style={[styles.formatTab, format === 'swiss' && styles.formatTabActive]}
                onPress={() => setFormat('swiss')}
              >
                <Ionicons
                  name="git-compare-outline"
                  size={16}
                  color={format === 'swiss' ? '#FFFFFF' : '#94A3B8'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.formatTabText, format === 'swiss' && styles.formatTabTextActive]}>
                  Sistema Suizo (OMW%)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatTab, format === 'single_elimination' && styles.formatTabActive]}
                onPress={() => setFormat('single_elimination')}
              >
                <Ionicons
                  name="git-network-outline"
                  size={16}
                  color={format === 'single_elimination' ? '#FFFFFF' : '#94A3B8'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.formatTabText, format === 'single_elimination' && styles.formatTabTextActive]}>
                  Eliminación (Bracket)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Duración de cada ronda */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tiempo por Ronda (Minutos)</Text>
            <View style={styles.durationPills}>
              {[35, 40, 45, 50, 60].map(mins => (
                <TouchableOpacity
                  key={mins}
                  style={[styles.durationPill, roundDuration === mins && styles.durationPillActive]}
                  onPress={() => setRoundDuration(mins)}
                >
                  <Text style={[styles.durationPillText, roundDuration === mins && styles.durationPillTextActive]}>
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Lista de Participantes */}
          <View style={styles.formGroup}>
            <View style={styles.playerHeaderRow}>
              <Text style={styles.label}>
                Participantes ({players.length}/16)
              </Text>
              <TouchableOpacity onPress={handlePreset8Players}>
                <Text style={styles.presetLinkText}>Cargar 8 Jugadores Demo</Text>
              </TouchableOpacity>
            </View>

            {/* Input para agregar jugador */}
            <View style={styles.addPlayerRow}>
              <TextInput
                style={styles.addPlayerInput}
                value={playerNameInput}
                onChangeText={setPlayerNameInput}
                placeholder="Nombre del jugador o apodo..."
                placeholderTextColor="#64748B"
                onSubmitEditing={handleAddPlayer}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addPlayerBtn} onPress={handleAddPlayer}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addPlayerBtnText}>Añadir</Text>
              </TouchableOpacity>
            </View>

            {/* Chips de jugadores */}
            <View style={styles.playersList}>
              {players.map((p, index) => (
                <View key={p.id} style={styles.playerChip}>
                  <Text style={styles.playerIndex}>#{index + 1}</Text>
                  <Text style={styles.playerChipName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemovePlayer(p.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Botón de Iniciar Torneo */}
          <TouchableOpacity
            style={[styles.startBtn, players.length < 4 && styles.startBtnDisabled]}
            onPress={handleStartTournament}
            disabled={players.length < 4}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.startBtnText}>
              Iniciar Torneo ({calculateRecommendedRounds(players.length, format)} Rondas)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: RONDAS EN VIVO Y CONTROL DE MESAS               */}
      {/* ======================================================== */}
      {tournament && tournament.status === 'in_progress' && (
        <View style={{ flex: 1 }}>
          {/* Header del Temporizador Global */}
          <View style={styles.timerHeaderCard}>
            <View style={styles.timerInfoLeft}>
              <Text style={styles.roundBadgeText}>
                {currentRound?.name || `Ronda ${tournament.currentRoundNumber}`} de {tournament.totalRounds}
              </Text>
              <Text
                style={[
                  styles.timerClockText,
                  secondsLeft <= 300 && { color: '#EF4444' },
                ]}
              >
                {formatTimer(secondsLeft)}
              </Text>
            </View>

            <View style={styles.timerControls}>
              <TouchableOpacity
                style={[styles.timerControlBtn, isTimerRunning && styles.timerControlBtnActive]}
                onPress={() => setIsTimerRunning(prev => !prev)}
              >
                <Ionicons
                  name={isTimerRunning ? 'pause' : 'play'}
                  size={20}
                  color={isTimerRunning ? '#F59E0B' : '#10B981'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timerControlBtn}
                onPress={() => setSecondsLeft(prev => prev + 300)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.addTimeText}>+5m</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sub-tabs: Enfrentamientos vs Tabla de Posiciones */}
          <View style={styles.roundSubTabs}>
            <TouchableOpacity
              style={[styles.roundSubTab, viewTab === 'matches' && styles.roundSubTabActive]}
              onPress={() => setViewTab('matches')}
            >
              <Ionicons
                name="grid-outline"
                size={15}
                color={viewTab === 'matches' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.roundSubTabText, viewTab === 'matches' && styles.roundSubTabTextActive]}>
                Mesas ({currentRound?.matches.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roundSubTab, viewTab === 'standings' && styles.roundSubTabActive]}
              onPress={() => setViewTab('standings')}
            >
              <Ionicons
                name="list"
                size={15}
                color={viewTab === 'standings' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.roundSubTabText, viewTab === 'standings' && styles.roundSubTabTextActive]}>
                Posiciones en Vivo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenido según vista */}
          {viewTab === 'matches' ? (
            <ScrollView style={styles.contentScroll} contentContainerStyle={styles.matchesListContainer} showsVerticalScrollIndicator={false}>
              {currentRound?.matches.map(m => {
                const isP1Winner = m.result.winnerId === m.player1.id;
                const isP2Winner = m.player2 && m.result.winnerId === m.player2.id;
                const isDraw = m.result.isDraw;

                return (
                  <View key={m.id} style={[styles.tableCard, m.isFinished && styles.tableCardFinished]}>
                    <View style={styles.tableHeaderRow}>
                      <View style={styles.tableNumberPill}>
                        <Text style={styles.tableNumberText}>Mesa {m.tableNumber}</Text>
                      </View>
                      <View style={styles.matchStatusPill}>
                        <Text style={[styles.matchStatusText, m.isFinished && { color: '#10B981' }]}>
                          {m.isFinished ? '✓ Finalizado' : 'En juego'}
                        </Text>
                      </View>
                    </View>

                    {/* Fila de Jugadores */}
                    <View style={styles.playersMatchRow}>
                      {/* Jugador 1 */}
                      <View style={[styles.playerSide, isP1Winner && styles.playerSideWinner]}>
                        <Text style={[styles.playerName, isP1Winner && styles.playerNameWinner]} numberOfLines={1}>
                          {m.player1.name}
                        </Text>
                        <Text style={styles.playerScoreLarge}>
                          {m.result.reported ? m.result.player1Score : '—'}
                        </Text>
                      </View>

                      <Text style={styles.vsText}>VS</Text>

                      {/* Jugador 2 (o Bye) */}
                      <View style={[styles.playerSide, isP2Winner && styles.playerSideWinner]}>
                        <Text style={[styles.playerName, isP2Winner && styles.playerNameWinner]} numberOfLines={1}>
                          {m.player2 ? m.player2.name : 'BYE (Pase Directo)'}
                        </Text>
                        <Text style={styles.playerScoreLarge}>
                          {m.result.reported ? m.result.player2Score : '—'}
                        </Text>
                      </View>
                    </View>

                    {/* Botones de Marcador Rápido (si no es un Bye) */}
                    {m.player2 && (
                      <View style={styles.quickScoreRow}>
                        <TouchableOpacity
                          style={[styles.quickScoreBtn, m.result.player1Score === 2 && m.result.player2Score === 0 && styles.quickScoreBtnActive]}
                          onPress={() => handleReportMatch(m.id, 2, 0)}
                        >
                          <Text style={styles.quickScoreBtnText}>2 - 0</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.quickScoreBtn, m.result.player1Score === 2 && m.result.player2Score === 1 && styles.quickScoreBtnActive]}
                          onPress={() => handleReportMatch(m.id, 2, 1)}
                        >
                          <Text style={styles.quickScoreBtnText}>2 - 1</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.quickScoreBtn, m.result.player1Score === 1 && m.result.player2Score === 2 && styles.quickScoreBtnActive]}
                          onPress={() => handleReportMatch(m.id, 1, 2)}
                        >
                          <Text style={styles.quickScoreBtnText}>1 - 2</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.quickScoreBtn, m.result.player1Score === 0 && m.result.player2Score === 2 && styles.quickScoreBtnActive]}
                          onPress={() => handleReportMatch(m.id, 0, 2)}
                        >
                          <Text style={styles.quickScoreBtnText}>0 - 2</Text>
                        </TouchableOpacity>

                        {tournament.format === 'swiss' && (
                          <TouchableOpacity
                            style={[styles.quickScoreBtn, isDraw && styles.quickScoreBtnActive]}
                            onPress={() => handleReportMatch(m.id, 1, 1, true)}
                          >
                            <Text style={styles.quickScoreBtnText}>1 - 1 (E)</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Botón para cerrar ronda y avanzar */}
              <TouchableOpacity
                style={[styles.advanceRoundBtn, !allMatchesFinished && styles.advanceRoundBtnDisabled]}
                onPress={handleNextRound}
                activeOpacity={0.85}
              >
                <Text style={styles.advanceRoundBtnText}>
                  {tournament.currentRoundNumber >= tournament.totalRounds
                    ? 'Finalizar Torneo y Ver Podio'
                    : 'Cerrar Ronda y Generar Siguiente ›'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* Tabla de Posiciones en Vivo */
            <ScrollView style={styles.contentScroll} contentContainerStyle={styles.standingsContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.standingsTableHeader}>
                <Text style={[styles.stTh, { width: 32 }]}>#</Text>
                <Text style={[styles.stTh, { flex: 1 }]}>Jugador</Text>
                <Text style={[styles.stTh, { width: 44, textAlign: 'center' }]}>PTS</Text>
                <Text style={[styles.stTh, { width: 64, textAlign: 'center' }]}>V-D-E</Text>
                <Text style={[styles.stTh, { width: 54, textAlign: 'right' }]}>OMW%</Text>
              </View>

              {currentStandings.map(s => (
                <View key={s.player.id} style={styles.standingsTableRow}>
                  <Text style={[styles.stTdRank, { width: 32 }]}>
                    {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank}
                  </Text>
                  <Text style={[styles.stTdName, { flex: 1 }]} numberOfLines={1}>
                    {s.player.name}
                  </Text>
                  <Text style={[styles.stTdPts, { width: 44, textAlign: 'center' }]}>
                    {s.points}
                  </Text>
                  <Text style={[styles.stTdRecord, { width: 64, textAlign: 'center' }]}>
                    {s.matchWins}-{s.matchLosses}-{s.matchDraws}
                  </Text>
                  <Text style={[styles.stTdOmw, { width: 54, textAlign: 'right' }]}>
                    {s.omwPercent}%
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: RESUMEN FINAL, PODIO Y EXPORTACIÓN               */}
      {/* ======================================================== */}
      {tournament && tournament.status === 'completed' && (
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.podiumContainer} showsVerticalScrollIndicator={false}>
          {/* Tarjeta del Campeón */}
          <View style={styles.championBox}>
            <View style={styles.trophyIconLarge}>
              <Ionicons name="trophy" size={48} color="#FBBF24" />
            </View>
            <Text style={styles.championLabel}>¡CAMPEÓN DEL TORNEO!</Text>
            <Text style={styles.championName}>
              {tournament.champion?.name || tournament.podium?.first.name}
            </Text>
            <Text style={styles.championSub}>
              {tournament.name} • {tournament.format === 'swiss' ? 'Sistema Suizo' : 'Eliminación Directa'}
            </Text>
          </View>

          {/* Podio: 2° y 3° Lugar */}
          <View style={styles.podiumRow}>
            {tournament.podium?.second && (
              <View style={[styles.podiumCard, styles.podiumSilver]}>
                <Text style={styles.medalEmoji}>🥈</Text>
                <Text style={styles.podiumPlaceTitle}>2° Lugar</Text>
                <Text style={styles.podiumPlayerName} numberOfLines={1}>
                  {tournament.podium.second.name}
                </Text>
              </View>
            )}

            {tournament.podium?.third && (
              <View style={[styles.podiumCard, styles.podiumBronze]}>
                <Text style={styles.medalEmoji}>🥉</Text>
                <Text style={styles.podiumPlaceTitle}>3° Lugar</Text>
                <Text style={styles.podiumPlayerName} numberOfLines={1}>
                  {tournament.podium.third.name}
                </Text>
              </View>
            )}
          </View>

          {/* Tabla de Posiciones Final */}
          <View style={styles.finalStandingsCard}>
            <Text style={styles.finalStandingsTitle}>Clasificación Final Oficial</Text>

            <View style={styles.standingsTableHeader}>
              <Text style={[styles.stTh, { width: 32 }]}>#</Text>
              <Text style={[styles.stTh, { flex: 1 }]}>Jugador</Text>
              <Text style={[styles.stTh, { width: 44, textAlign: 'center' }]}>PTS</Text>
              <Text style={[styles.stTh, { width: 64, textAlign: 'center' }]}>V-D-E</Text>
              <Text style={[styles.stTh, { width: 54, textAlign: 'right' }]}>OMW%</Text>
            </View>

            {currentStandings.map(s => (
              <View key={s.player.id} style={styles.standingsTableRow}>
                <Text style={[styles.stTdRank, { width: 32 }]}>
                  {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank}
                </Text>
                <Text style={[styles.stTdName, { flex: 1 }]} numberOfLines={1}>
                  {s.player.name}
                </Text>
                <Text style={[styles.stTdPts, { width: 44, textAlign: 'center' }]}>
                  {s.points}
                </Text>
                <Text style={[styles.stTdRecord, { width: 64, textAlign: 'center' }]}>
                  {s.matchWins}-{s.matchLosses}-{s.matchDraws}
                </Text>
                <Text style={[styles.stTdOmw, { width: 54, textAlign: 'right' }]}>
                  {s.omwPercent}%
                </Text>
              </View>
            ))}
          </View>

          {/* Botones de Compartir y Nuevo Torneo */}
          <View style={styles.podiumActionsRow}>
            <TouchableOpacity style={styles.shareResultsBtn} onPress={handleShareResults} activeOpacity={0.85}>
              <Ionicons name="share-social" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.shareResultsText}>Compartir Resultados (WhatsApp / Discord)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.newTourneyBtn} onPress={handleResetTournament} activeOpacity={0.85}>
              <Text style={styles.newTourneyText}>Nuevo Torneo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  resetBtn: {
    padding: 6,
  },
  contentScroll: {
    flex: 1,
  },
  setupContainer: {
    padding: 16,
    paddingBottom: 60,
  },
  bannerBox: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  bannerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  formatTabs: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 4,
    gap: 6,
  },
  formatTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  formatTabActive: {
    backgroundColor: '#1E293B',
  },
  formatTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  formatTabTextActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  durationPills: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 8,
  },
  durationPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  durationPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  playerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  addPlayerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  addPlayerInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  addPlayerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
  },
  playerIndex: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  playerChipName: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
    maxWidth: 110,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
  startBtnDisabled: {
    opacity: 0.5,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  /* VISTA 2: Temporizador y Rondas */
  timerHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  timerInfoLeft: {
    flex: 1,
  },
  roundBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  timerClockText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerControlBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  addTimeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  roundSubTabs: {
    flexDirection: 'row',
    backgroundColor: '#090D14',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 3,
  },
  roundSubTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 6,
  },
  roundSubTabActive: {
    backgroundColor: '#1E293B',
  },
  roundSubTabText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  roundSubTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  matchesListContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  tableCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    marginBottom: 10,
  },
  tableCardFinished: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableNumberPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  matchStatusPill: {
    paddingHorizontal: 6,
  },
  matchStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  playersMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  playerSide: {
    flex: 1,
    backgroundColor: '#090D14',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 10,
    alignItems: 'center',
  },
  playerSideWinner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  playerNameWinner: {
    fontWeight: '800',
    color: '#6EE7B7',
  },
  playerScoreLarge: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginHorizontal: 8,
  },
  quickScoreRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  quickScoreBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingVertical: 6,
  },
  quickScoreBtnActive: {
    backgroundColor: '#2563EB',
  },
  quickScoreBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  advanceRoundBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  advanceRoundBtnDisabled: {
    opacity: 0.5,
  },
  advanceRoundBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  /* Tabla de Posiciones */
  standingsContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  standingsTableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  stTh: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  standingsTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  stTdRank: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stTdName: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  stTdPts: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  stTdRecord: {
    fontSize: 12,
    color: '#94A3B8',
  },
  stTdOmw: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  /* VISTA 3: Podio */
  podiumContainer: {
    padding: 16,
    paddingBottom: 60,
  },
  championBox: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 20,
    marginBottom: 16,
  },
  trophyIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  championLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1,
  },
  championName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    marginTop: 4,
  },
  championSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  podiumCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  podiumSilver: {
    borderColor: '#94A3B8',
  },
  podiumBronze: {
    borderColor: '#D97706',
  },
  medalEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumPlaceTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  podiumPlayerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  finalStandingsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 16,
  },
  finalStandingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  podiumActionsRow: {
    gap: 10,
  },
  shareResultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
  },
  shareResultsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  newTourneyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
  },
  newTourneyText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
});
