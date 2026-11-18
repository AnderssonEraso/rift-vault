import { Ionicons } from '@expo/vector-icons';

export type AchievementCategory = 'collection' | 'decks' | 'competitive' | 'social';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: keyof typeof Ionicons.glyphMap;
  badgeColor: string;
  targetValue: number;
  unit: string;
  rewardXp: number;
}

export interface UserAchievementProgress {
  achievementId: string;
  currentValue: number;
  isUnlocked: boolean;
  unlockedAt?: string; // ISO Date string
}

export const ACHIEVEMENTS_CATALOG: Achievement[] = [
  // --- Coleccionista ---
  {
    id: 'first_card',
    title: 'Primeros Pasos',
    description: 'Registra tu primera carta física en la colección.',
    category: 'collection',
    icon: 'sparkles',
    badgeColor: '#10B981', // Verde esmeralda
    targetValue: 1,
    unit: 'carta',
    rewardXp: 50,
  },
  {
    id: 'domain_master',
    title: 'Maestro del Dominio',
    description: 'Colecciona al menos 10 cartas de un mismo dominio elemental.',
    category: 'collection',
    icon: 'shield-outline',
    badgeColor: '#0EA5E9', // Cyan / Azul
    targetValue: 10,
    unit: 'cartas',
    rewardXp: 150,
  },
  {
    id: 'foil_collector',
    title: 'Elixir Brillante',
    description: 'Añade tu primera carta con acabado Foil o Holo a tu colección.',
    category: 'collection',
    icon: 'star',
    badgeColor: '#F59E0B', // Ámbar dorado
    targetValue: 1,
    unit: 'foil',
    rewardXp: 100,
  },
  {
    id: 'hoarder_50',
    title: 'Invocador Dorado',
    description: 'Acumula un total de 50 o más cartas físicas en tus carpetas.',
    category: 'collection',
    icon: 'trophy',
    badgeColor: '#EAB308', // Oro
    targetValue: 50,
    unit: 'cartas',
    rewardXp: 300,
  },
  {
    id: 'binder_vault',
    title: 'Guardián de la Bóveda',
    description: 'Alcanza el hito de 100 cartas registradas en tu colección física.',
    category: 'collection',
    icon: 'archive-outline',
    badgeColor: '#8B5CF6', // Púrpura
    targetValue: 100,
    unit: 'cartas',
    rewardXp: 500,
  },

  // --- Arquitecto de Mazos ---
  {
    id: 'first_deck',
    title: 'Arquitecto Iniciado',
    description: 'Crea y guarda tu primer mazo de combate en la app.',
    category: 'decks',
    icon: 'layers-outline',
    badgeColor: '#3B82F6', // Azul intenso
    targetValue: 1,
    unit: 'mazo',
    rewardXp: 75,
  },
  {
    id: 'legal_deck',
    title: 'Estratega de Mazos',
    description: 'Arma un mazo reglamentario completo con 40 o más cartas.',
    category: 'decks',
    icon: 'checkmark-circle-outline',
    badgeColor: '#059669', // Verde bosque
    targetValue: 1,
    unit: 'mazo',
    rewardXp: 200,
  },
  {
    id: 'legend_pantheon',
    title: 'Arsenal Cósmico',
    description: 'Construye 3 o más mazos con diferentes Leyendas de Riftbound.',
    category: 'decks',
    icon: 'flame-outline',
    badgeColor: '#EC4899', // Rosa / Magenta
    targetValue: 3,
    unit: 'leyendas',
    rewardXp: 350,
  },

  // --- Competitivo ---
  {
    id: 'first_blood',
    title: 'Primera Sangre',
    description: 'Registra tu primera victoria oficial en el historial de partidas.',
    category: 'competitive',
    icon: 'flash-outline',
    badgeColor: '#EF4444', // Rojo furia
    targetValue: 1,
    unit: 'victoria',
    rewardXp: 100,
  },
  {
    id: 'win_streak_3',
    title: 'Imparable',
    description: 'Consigue una racha de 3 victorias consecutivas sin derrotas.',
    category: 'competitive',
    icon: 'trending-up-outline',
    badgeColor: '#F97316', // Naranja fuego
    targetValue: 3,
    unit: 'racha',
    rewardXp: 300,
  },
  {
    id: 'nexus_gladiator',
    title: 'Gladiador del Nexo',
    description: 'Disputa y registra al menos 5 partidas en el registro de mazos.',
    category: 'competitive',
    icon: 'medal-outline',
    badgeColor: '#6366F1', // Indigo
    targetValue: 5,
    unit: 'partidas',
    rewardXp: 250,
  },

  // --- Social e Interacción ---
  {
    id: 'social_synergy',
    title: 'Poder Social',
    description: 'Agrega a 3 o más invocadores a tu lista de amigos.',
    category: 'social',
    icon: 'people-outline',
    badgeColor: '#06B6D4', // Cian
    targetValue: 3,
    unit: 'amigos',
    rewardXp: 150,
  },
  {
    id: 'lynx_eye',
    title: 'Ojo de Lince',
    description: 'Escanea al menos una carta física utilizando el escáner con cámara.',
    category: 'social',
    icon: 'scan-outline',
    badgeColor: '#14B8A6', // Teal
    targetValue: 1,
    unit: 'escaneo',
    rewardXp: 100,
  },
  {
    id: 'wishlist_dreamer',
    title: 'Cazador de Rarezas',
    description: 'Añade tu primera carta codiciada a la Lista de Deseados.',
    category: 'social',
    icon: 'heart-outline',
    badgeColor: '#F43F5E', // Rosa intenso
    targetValue: 1,
    unit: 'deseada',
    rewardXp: 75,
  },
];
