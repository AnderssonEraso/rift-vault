import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Achievement, ACHIEVEMENTS_CATALOG } from '@/constants/achievements';

const STORAGE_KEY = '@riftdex_user_achievements_v1';
const ACTION_FLAGS_KEY = '@riftdex_action_flags_v1';
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export interface UnlockedAchievementData {
  unlockedAt: string;
}

export type UnlockedAchievementsMap = Record<string, UnlockedAchievementData>;

export interface ActionFlags {
  scannedCard?: boolean;
  usedTrade?: boolean;
}

export interface AchievementEvaluationInput {
  totalCards: number;
  foilCards: number;
  domainCounts: Record<string, number>;
  decksCount: number;
  legalDecksCount: number;
  uniqueLegendsCount: number;
  totalMatches: number;
  totalWins: number;
  winStreak: number;
  friendsCount: number;
  wishlistCount: number;
  actionFlags?: ActionFlags;
}

export interface EvaluatedAchievement {
  achievement: Achievement;
  currentValue: number;
  targetValue: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progressPercent: number; // 0 to 100
}

export interface EvaluationResult {
  evaluations: EvaluatedAchievement[];
  newlyUnlocked: Achievement[];
  totalXp: number;
  unlockedCount: number;
  totalCount: number;
}

export async function getActionFlags(): Promise<ActionFlags> {
  if (isServer) return {};
  try {
    const raw = await AsyncStorage.getItem(ACTION_FLAGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setActionFlag(flag: keyof ActionFlags, value: boolean = true): Promise<void> {
  if (isServer) return;
  try {
    const current = await getActionFlags();
    current[flag] = value;
    await AsyncStorage.setItem(ACTION_FLAGS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('⚠️ Error guardando action flag:', e);
  }
}

export async function getStoredUnlockedAchievements(): Promise<UnlockedAchievementsMap> {
  if (isServer) return {};
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveStoredUnlockedAchievements(data: UnlockedAchievementsMap): Promise<void> {
  if (isServer) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('⚠️ Error guardando logros desbloqueados:', e);
  }
}

export function evaluateUserAchievements(
  input: AchievementEvaluationInput,
  previouslyUnlocked: UnlockedAchievementsMap
): { result: EvaluationResult; updatedUnlockedMap: UnlockedAchievementsMap } {
  const updatedUnlockedMap: UnlockedAchievementsMap = { ...previouslyUnlocked };
  const newlyUnlocked: Achievement[] = [];

  // Calcular el valor máximo por dominio
  const maxDomainCount = Math.max(0, ...Object.values(input.domainCounts || {}));

  const evaluations: EvaluatedAchievement[] = ACHIEVEMENTS_CATALOG.map(achievement => {
    let current = 0;

    switch (achievement.id) {
      case 'first_card':
      case 'hoarder_50':
      case 'binder_vault':
        current = input.totalCards;
        break;
      case 'domain_master':
        current = maxDomainCount;
        break;
      case 'foil_collector':
        current = input.foilCards;
        break;
      case 'first_deck':
        current = input.decksCount;
        break;
      case 'legal_deck':
        current = input.legalDecksCount;
        break;
      case 'legend_pantheon':
        current = input.uniqueLegendsCount;
        break;
      case 'first_blood':
        current = input.totalWins;
        break;
      case 'win_streak_3':
        current = input.winStreak;
        break;
      case 'nexus_gladiator':
        current = input.totalMatches;
        break;
      case 'social_synergy':
        current = input.friendsCount;
        break;
      case 'lynx_eye':
        current = input.actionFlags?.scannedCard ? 1 : 0;
        break;
      case 'wishlist_dreamer':
        current = input.wishlistCount;
        break;
      default:
        current = 0;
    }

    const wasUnlocked = !!previouslyUnlocked[achievement.id];
    const isNowUnlocked = wasUnlocked || current >= achievement.targetValue;

    if (!wasUnlocked && isNowUnlocked) {
      updatedUnlockedMap[achievement.id] = {
        unlockedAt: new Date().toISOString(),
      };
      newlyUnlocked.push(achievement);
    }

    const percent = Math.min(100, Math.floor((Math.max(0, current) / achievement.targetValue) * 100));

    return {
      achievement,
      currentValue: current,
      targetValue: achievement.targetValue,
      isUnlocked: isNowUnlocked,
      unlockedAt: updatedUnlockedMap[achievement.id]?.unlockedAt,
      progressPercent: percent,
    };
  });

  const unlockedCount = evaluations.filter(e => e.isUnlocked).length;
  const totalXp = evaluations
    .filter(e => e.isUnlocked)
    .reduce((sum, e) => sum + e.achievement.rewardXp, 0);

  return {
    result: {
      evaluations,
      newlyUnlocked,
      totalXp,
      unlockedCount,
      totalCount: ACHIEVEMENTS_CATALOG.length,
    },
    updatedUnlockedMap,
  };
}
