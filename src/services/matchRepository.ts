import { DeckMatchRecord, DeckMatchStats } from '@/types/match';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

const MATCHES_STORAGE_KEY = '@riftdex_deck_matches_v1';
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

async function getStoredMatches(): Promise<DeckMatchRecord[]> {
  if (isServer) return [];
  try {
    const raw = await AsyncStorage.getItem(MATCHES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveStoredMatches(matches: DeckMatchRecord[]): Promise<void> {
  if (isServer) return;
  try {
    await AsyncStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
  } catch (e) {
    console.warn('⚠️ Error guardando historial de partidas:', e);
  }
}

export const MatchRepository = {
  /**
   * Obtiene todas las partidas registradas en el historial global
   */
  async getAllMatches(): Promise<DeckMatchRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('deck_matches')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: DeckMatchRecord[] = data.map((r: any) => ({
            id: r.id,
            deckId: r.deck_id,
            deckName: r.deck_name,
            opponentName: r.opponent_name,
            opponentChampion: r.opponent_champion,
            result: r.result,
            playerScore: r.player_score,
            opponentScore: r.opponent_score,
            notes: r.notes,
            createdAt: r.created_at,
          }));
          return mapped;
        }
      } catch (e) {
        console.warn('⚠️ Supabase getAllMatches falló:', e);
      }
    }
    return await getStoredMatches();
  },

  /**
   * Obtiene todas las partidas registradas para un mazo
   */
  async getMatchesForDeck(deckId: string): Promise<DeckMatchRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('deck_matches')
          .select('*')
          .eq('deck_id', deckId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: DeckMatchRecord[] = data.map((r: any) => ({
            id: r.id,
            deckId: r.deck_id,
            deckName: r.deck_name,
            opponentName: r.opponent_name,
            opponentChampion: r.opponent_champion,
            result: r.result,
            playerScore: r.player_score,
            opponentScore: r.opponent_score,
            notes: r.notes,
            createdAt: r.created_at,
          }));
          return mapped;
        }
      } catch (e) {
        console.warn('⚠️ Supabase getMatchesForDeck falló:', e);
      }
    }

    const local = await getStoredMatches();
    return local.filter(m => m.deckId === deckId);
  },

  /**
   * Registra una nueva partida jugada con el mazo
   */
  async recordMatch(data: {
    deckId: string;
    deckName: string;
    opponentName: string;
    opponentChampion?: string;
    result: 'win' | 'loss' | 'draw';
    playerScore: number;
    opponentScore: number;
    notes?: string;
  }): Promise<DeckMatchRecord> {
    const newRecord: DeckMatchRecord = {
      id: `match_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data: created, error } = await supabase
          .from('deck_matches')
          .insert([
            {
              deck_id: newRecord.deckId,
              deck_name: newRecord.deckName,
              opponent_name: newRecord.opponentName,
              opponent_champion: newRecord.opponentChampion,
              result: newRecord.result,
              player_score: newRecord.playerScore,
              opponent_score: newRecord.opponentScore,
              notes: newRecord.notes,
            },
          ])
          .select()
          .single();

        if (!error && created) {
          newRecord.id = created.id;
        }
      } catch (e) {
        console.warn('⚠️ Supabase recordMatch falló:', e);
      }
    }

    const current = await getStoredMatches();
    await saveStoredMatches([newRecord, ...current]);
    return newRecord;
  },

  /**
   * Elimina un registro de partida
   */
  async deleteMatch(matchId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('deck_matches').delete().eq('id', matchId);
      } catch (e) {
        console.warn('⚠️ Supabase deleteMatch falló:', e);
      }
    }

    const current = await getStoredMatches();
    await saveStoredMatches(current.filter(m => m.id !== matchId));
  },

  /**
   * Calcula estadísticas de victorias/derrotas y porcentaje de winrate
   */
  calculateStats(matches: DeckMatchRecord[]): DeckMatchStats {
    const totalMatches = matches.length;
    if (totalMatches === 0) {
      return {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winrate: 0,
      };
    }

    const wins = matches.filter(m => m.result === 'win').length;
    const losses = matches.filter(m => m.result === 'loss').length;
    const draws = matches.filter(m => m.result === 'draw').length;
    const winrate = Math.round((wins / totalMatches) * 100);

    return {
      totalMatches,
      wins,
      losses,
      draws,
      winrate,
    };
  },
};
