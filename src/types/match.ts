export interface MatchPlayer {
  id: string;
  name: string;
  championName: string;
  championImage: string;
  score: number;
  xp: number;
  color: string;
  isWinner: boolean;
}

export interface MatchSettings {
  maxPoints: number; // Por reglamento oficial de Riftbound es 8
  enableXpCounter: boolean;
  playerCount: 1 | 2 | 3 | 4;
}

export interface MatchHistoryEntry {
  id: string;
  playerId: string;
  playerName: string;
  type: 'score' | 'xp';
  delta: number;
  newTotal: number;
  timestamp: string;
}

export interface RiftMatch {
  id: string;
  status: 'setup' | 'active' | 'finished';
  settings: MatchSettings;
  players: MatchPlayer[];
  winnerId: string | null;
  history: MatchHistoryEntry[];
  startedAt: string;
  endedAt?: string;
}

/**
 * Registro de partida vinculada a un mazo específico
 */
export interface DeckMatchRecord {
  id: string;
  deckId: string;
  deckName: string;
  opponentName: string;
  opponentChampion?: string;
  result: 'win' | 'loss' | 'draw';
  playerScore: number;
  opponentScore: number;
  notes?: string;
  createdAt: string;
}

/**
 * Estadísticas consolidadas de rendimiento y winrate de un mazo
 */
export interface DeckMatchStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winrate: number; // Porcentaje de victorias (0 - 100)
}
