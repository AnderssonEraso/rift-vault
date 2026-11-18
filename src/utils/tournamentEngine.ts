import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type TournamentFormat = 'swiss' | 'single_elimination';

export interface Player {
  id: string;
  name: string;
  seed?: number;
  deckName?: string;
  avatar?: string;
}

export interface MatchResult {
  player1Score: number;
  player2Score: number;
  isDraw?: boolean;
  isBye?: boolean;
  reported: boolean;
  winnerId?: string | 'draw';
}

export interface TournamentMatch {
  id: string;
  roundNumber: number;
  tableNumber: number;
  player1: Player;
  player2?: Player; // undefined si es un Bye
  result: MatchResult;
  isFinished: boolean;
}

export interface TournamentRound {
  roundNumber: number;
  name?: string; // ej: "Octavos", "Cuartos", "Semifinal", "Final", "Ronda 1"
  matches: TournamentMatch[];
  isCompleted: boolean;
  startTime?: string;
  durationMinutes: number;
}

export interface PlayerStanding {
  rank: number;
  player: Player;
  points: number; // 3 Victoria, 1 Empate, 0 Derrota
  matchesPlayed: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  gameWins: number;
  gameLosses: number;
  omwPercent: number; // Opponent Match Win % (mínimo 33%)
  gwPercent: number; // Game Win %
  opponents: string[]; // IDs de oponentes
  hadBye: boolean;
}

export interface TournamentState {
  id: string;
  name: string;
  format: TournamentFormat;
  roundDurationMinutes: number;
  players: Player[];
  totalRounds: number;
  currentRoundNumber: number;
  rounds: TournamentRound[];
  status: 'setup' | 'in_progress' | 'completed';
  champion?: Player;
  podium?: {
    first: Player;
    second?: Player;
    third?: Player;
  };
  createdAt: string;
  updatedAt: string;
}

const STORAGE_ACTIVE_KEY = '@riftdex_tournament_active';
const STORAGE_HISTORY_KEY = '@riftdex_tournament_history';
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

/**
 * Calcula el número recomendado de rondas suizas según el total de jugadores
 * 4 jugadores -> 2 o 3 rondas
 * 5-8 jugadores -> 3 rondas
 * 9-16 jugadores -> 4 rondas
 * 17-32 jugadores -> 5 rondas
 */
export function calculateRecommendedRounds(playerCount: number, format: TournamentFormat): number {
  if (playerCount < 2) return 1;
  if (format === 'single_elimination') {
    return Math.ceil(Math.log2(playerCount));
  }
  // Sistema Suizo
  if (playerCount <= 4) return 3;
  if (playerCount <= 8) return 3;
  if (playerCount <= 16) return 4;
  if (playerCount <= 32) return 5;
  return Math.ceil(Math.log2(playerCount));
}

/**
 * Verifica si dos jugadores ya se han enfrentado en rondas anteriores
 */
export function havePlayedTogether(
  p1Id: string,
  p2Id: string,
  rounds: TournamentRound[]
): boolean {
  for (const r of rounds) {
    for (const m of r.matches) {
      if (!m.player2) continue;
      if (
        (m.player1.id === p1Id && m.player2.id === p2Id) ||
        (m.player1.id === p2Id && m.player2.id === p1Id)
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Obtiene los IDs de los jugadores que ya han recibido un Bye
 */
export function getPlayersWithBye(rounds: TournamentRound[]): Set<string> {
  const byes = new Set<string>();
  for (const r of rounds) {
    for (const m of r.matches) {
      if (!m.player2 || m.result.isBye) {
        byes.add(m.player1.id);
      }
    }
  }
  return byes;
}

/**
 * Calcula la tabla de posiciones (Standings) completa con desempate OMW%
 */
export function calculateStandings(
  players: Player[],
  rounds: TournamentRound[]
): PlayerStanding[] {
  const standingsMap = new Map<string, PlayerStanding>();

  for (const p of players) {
    standingsMap.set(p.id, {
      rank: 0,
      player: p,
      points: 0,
      matchesPlayed: 0,
      matchWins: 0,
      matchLosses: 0,
      matchDraws: 0,
      gameWins: 0,
      gameLosses: 0,
      omwPercent: 0,
      gwPercent: 0,
      opponents: [],
      hadBye: false,
    });
  }

  // Recorrer todas las partidas terminadas
  for (const r of rounds) {
    for (const m of r.matches) {
      if (!m.isFinished && !m.result.reported) continue;

      const p1Stats = standingsMap.get(m.player1.id);
      if (!p1Stats) continue;

      // Caso Bye
      if (!m.player2 || m.result.isBye) {
        p1Stats.points += 3;
        p1Stats.matchesPlayed += 1;
        p1Stats.matchWins += 1;
        p1Stats.gameWins += 2;
        p1Stats.hadBye = true;
        continue;
      }

      const p2Stats = standingsMap.get(m.player2.id);
      if (!p2Stats) continue;

      p1Stats.matchesPlayed += 1;
      p2Stats.matchesPlayed += 1;

      p1Stats.opponents.push(m.player2.id);
      p2Stats.opponents.push(m.player1.id);

      p1Stats.gameWins += m.result.player1Score;
      p1Stats.gameLosses += m.result.player2Score;
      p2Stats.gameWins += m.result.player2Score;
      p2Stats.gameLosses += m.result.player1Score;

      if (m.result.isDraw || m.result.winnerId === 'draw') {
        p1Stats.points += 1;
        p2Stats.points += 1;
        p1Stats.matchDraws += 1;
        p2Stats.matchDraws += 1;
      } else if (m.result.winnerId === m.player1.id || m.result.player1Score > m.result.player2Score) {
        p1Stats.points += 3;
        p1Stats.matchWins += 1;
        p2Stats.matchLosses += 1;
      } else {
        p2Stats.points += 3;
        p2Stats.matchWins += 1;
        p1Stats.matchLosses += 1;
      }
    }
  }

  // Calcular Match Win Percentage de cada jugador (con piso de 0.33)
  const mwpMap = new Map<string, number>();
  for (const [id, s] of standingsMap.entries()) {
    if (s.matchesPlayed === 0) {
      mwpMap.set(id, 0.33);
    } else {
      const rawMWP = s.points / (s.matchesPlayed * 3);
      mwpMap.set(id, Math.max(0.33, rawMWP));
    }
  }

  // Calcular OMW% (Opponent Match Win Percentage)
  for (const s of standingsMap.values()) {
    if (s.opponents.length === 0) {
      s.omwPercent = 33.33;
    } else {
      let sumMWP = 0;
      for (const oppId of s.opponents) {
        sumMWP += mwpMap.get(oppId) || 0.33;
      }
      s.omwPercent = Number(((sumMWP / s.opponents.length) * 100).toFixed(2));
    }

    const totalGames = s.gameWins + s.gameLosses;
    s.gwPercent = totalGames > 0 ? Number(((s.gameWins / totalGames) * 100).toFixed(2)) : 0;
  }

  // Ordenar clasificación: Puntos (desc) -> OMW% (desc) -> GW% (desc)
  const sorted = Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.omwPercent !== a.omwPercent) return b.omwPercent - a.omwPercent;
    if (b.gwPercent !== a.gwPercent) return b.gwPercent - a.gwPercent;
    return b.gameWins - a.gameWins;
  });

  // Asignar rangos 1, 2, 3...
  sorted.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return sorted;
}

/**
 * Algoritmo de emparejamiento para Sistema Suizo
 */
export function generateSwissRound(
  players: Player[],
  pastRounds: TournamentRound[],
  roundNumber: number,
  durationMinutes: number
): TournamentRound {
  const standings = calculateStandings(players, pastRounds);
  const byesGiven = getPlayersWithBye(pastRounds);

  const availablePlayers = [...standings.map(s => s.player)];
  const matches: TournamentMatch[] = [];

  // Si el número de jugadores es impar, otorgar un Bye
  if (availablePlayers.length % 2 !== 0) {
    // Buscar desde el jugador de menor puntuación que NO haya tenido un Bye
    let byeIndex = -1;
    for (let i = availablePlayers.length - 1; i >= 0; i--) {
      if (!byesGiven.has(availablePlayers[i].id)) {
        byeIndex = i;
        break;
      }
    }
    // Fallback si todos ya tuvieron bye
    if (byeIndex === -1) {
      byeIndex = availablePlayers.length - 1;
    }

    const [byePlayer] = availablePlayers.splice(byeIndex, 1);
    matches.push({
      id: `match-r${roundNumber}-bye`,
      roundNumber,
      tableNumber: Math.ceil(players.length / 2),
      player1: byePlayer,
      player2: undefined,
      result: {
        player1Score: 2,
        player2Score: 0,
        isBye: true,
        reported: true,
        winnerId: byePlayer.id,
      },
      isFinished: true,
    });
  }

  // Emparejar los jugadores restantes evitando repeticiones
  let tableCounter = 1;

  while (availablePlayers.length > 0) {
    const p1 = availablePlayers.shift()!;
    let opponentIndex = -1;

    // Buscar al oponente más cercano en puntuación que no se haya enfrentado aún a p1
    for (let i = 0; i < availablePlayers.length; i++) {
      const candidate = availablePlayers[i];
      if (!havePlayedTogether(p1.id, candidate.id, pastRounds)) {
        opponentIndex = i;
        break;
      }
    }

    // Si todos ya se enfrentaron (rondas avanzadas en torneos pequeños), emparejar con el siguiente
    if (opponentIndex === -1 && availablePlayers.length > 0) {
      opponentIndex = 0;
    }

    if (opponentIndex !== -1) {
      const [p2] = availablePlayers.splice(opponentIndex, 1);
      matches.push({
        id: `match-r${roundNumber}-t${tableCounter}`,
        roundNumber,
        tableNumber: tableCounter++,
        player1: p1,
        player2: p2,
        result: {
          player1Score: 0,
          player2Score: 0,
          reported: false,
        },
        isFinished: false,
      });
    }
  }

  // Ordenar mesas para que la mesa de Bye quede al final
  matches.sort((a, b) => a.tableNumber - b.tableNumber);

  return {
    roundNumber,
    name: `Ronda ${roundNumber}`,
    matches,
    isCompleted: false,
    startTime: new Date().toISOString(),
    durationMinutes,
  };
}

/**
 * Genera la ronda inicial o siguiente de Eliminación Directa (Bracket)
 */
export function generateEliminationRound(
  players: Player[],
  pastRounds: TournamentRound[],
  roundNumber: number,
  durationMinutes: number
): TournamentRound {
  // Ronda 1: Emparejar por seeds o lista inicial
  if (roundNumber === 1) {
    const totalSlots = Math.pow(2, Math.ceil(Math.log2(players.length)));
    const matchesCount = totalSlots / 2;

    const roundName =
      matchesCount === 8
        ? 'Octavos de Final'
        : matchesCount === 4
        ? 'Cuartos de Final'
        : matchesCount === 2
        ? 'Semifinal'
        : 'Gran Final';

    const matches: TournamentMatch[] = [];
    const pool = [...players];

    for (let i = 0; i < matchesCount; i++) {
      const p1 = pool[i];
      const p2 = pool[totalSlots - 1 - i];

      if (!p1 && !p2) continue;

      if (p1 && !p2) {
        // Bye automático
        matches.push({
          id: `elim-r1-t${i + 1}`,
          roundNumber: 1,
          tableNumber: i + 1,
          player1: p1,
          player2: undefined,
          result: {
            player1Score: 2,
            player2Score: 0,
            isBye: true,
            reported: true,
            winnerId: p1.id,
          },
          isFinished: true,
        });
      } else {
        matches.push({
          id: `elim-r1-t${i + 1}`,
          roundNumber: 1,
          tableNumber: i + 1,
          player1: p1,
          player2: p2,
          result: {
            player1Score: 0,
            player2Score: 0,
            reported: false,
          },
          isFinished: false,
        });
      }
    }

    return {
      roundNumber: 1,
      name: roundName,
      matches,
      isCompleted: false,
      startTime: new Date().toISOString(),
      durationMinutes,
    };
  }

  // Rondas posteriores: Ganadores de la ronda previa
  const previousRound = pastRounds[roundNumber - 2];
  const winners: Player[] = [];

  for (const m of previousRound.matches) {
    if (m.result.winnerId && m.result.winnerId !== 'draw') {
      const winner = m.player1.id === m.result.winnerId ? m.player1 : m.player2;
      if (winner) winners.push(winner);
    }
  }

  const matchesCount = Math.ceil(winners.length / 2);
  const roundName =
    matchesCount === 4
      ? 'Cuartos de Final'
      : matchesCount === 2
      ? 'Semifinal'
      : matchesCount === 1
      ? 'Gran Final'
      : `Ronda ${roundNumber}`;

  const matches: TournamentMatch[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    const p1 = winners[i];
    const p2 = winners[i + 1];
    const tableNum = Math.floor(i / 2) + 1;

    matches.push({
      id: `elim-r${roundNumber}-t${tableNum}`,
      roundNumber,
      tableNumber: tableNum,
      player1: p1,
      player2: p2,
      result: {
        player1Score: 0,
        player2Score: 0,
        reported: false,
      },
      isFinished: false,
    });
  }

  return {
    roundNumber,
    name: roundName,
    matches,
    isCompleted: false,
    startTime: new Date().toISOString(),
    durationMinutes,
  };
}

/**
 * Repositorio de Almacenamiento Local para Torneo Activo e Historial
 */
export const TournamentRepository = {
  async getActiveTournament(): Promise<TournamentState | null> {
    if (isServer) return null;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_ACTIVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async saveActiveTournament(tournament: TournamentState): Promise<void> {
    if (isServer) return;
    try {
      tournament.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(tournament));
    } catch (e) {
      console.warn('⚠️ Error guardando torneo activo:', e);
    }
  },

  async clearActiveTournament(): Promise<void> {
    if (isServer) return;
    try {
      await AsyncStorage.removeItem(STORAGE_ACTIVE_KEY);
    } catch (e) {
      console.warn('⚠️ Error limpiando torneo activo:', e);
    }
  },

  async archiveTournament(tournament: TournamentState): Promise<void> {
    if (isServer) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_HISTORY_KEY);
      const history: TournamentState[] = raw ? JSON.parse(raw) : [];
      history.unshift(tournament);
      await AsyncStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
      await AsyncStorage.removeItem(STORAGE_ACTIVE_KEY);
    } catch (e) {
      console.warn('⚠️ Error archivando torneo:', e);
    }
  },
};

/**
 * Genera texto formateado para compartir en WhatsApp o Discord
 */
export function formatTournamentResultsText(tournament: TournamentState): string {
  const standings = calculateStandings(tournament.players, tournament.rounds);
  const champ = tournament.champion || standings[0]?.player;

  const lines: string[] = [];
  lines.push(`🏆 RESULTADOS OFICIALES • RIFTBOUND TCG 🏆`);
  lines.push(`Torneo: ${tournament.name}`);
  lines.push(`Formato: ${tournament.format === 'swiss' ? 'Sistema Suizo' : 'Eliminación Directa'}`);
  lines.push(`Participantes: ${tournament.players.length} jugadores`);
  lines.push(`Fecha: ${new Date(tournament.createdAt).toLocaleDateString()}`);
  lines.push(``);

  if (champ) {
    lines.push(`🥇 CAMPEÓN: ${champ.name.toUpperCase()}`);
    if (standings[1]) lines.push(`🥈 Subcampeón: ${standings[1].player.name}`);
    if (standings[2]) lines.push(`🥉 3° Lugar: ${standings[2].player.name}`);
    lines.push(``);
  }

  lines.push(`📊 TABLA DE POSICIONES FINAL:`);
  standings.forEach(s => {
    const record = `${s.matchWins}V - ${s.matchLosses}D - ${s.matchDraws}E`;
    lines.push(
      `${s.rank}. ${s.player.name} — ${s.points} pts | ${record} | OMW: ${s.omwPercent}%`
    );
  });

  lines.push(``);
  lines.push(`Generado automáticamente con Rift Dex TCG`);

  return lines.join('\n');
}
