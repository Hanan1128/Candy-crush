/**
 * Types and Interfaces for Advanced Candy Crush Mobile Game
 */

export type CandyColor = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple';

export type CandyType = 'standard' | 'striped-row' | 'striped-col' | 'wrapped' | 'color-bomb';

export interface Candy {
  id: string; // Unique ID for key tracking and rendering animations
  color: CandyColor;
  type: CandyType;
  bombTimer?: number; // Count down timer for Bomb obstacle candy (optional)
}

// Obstacle details
export type ObstacleType = 
  | 'none'
  | 'ice1'       // Single ice layer
  | 'ice2'       // Double ice layer
  | 'locked'     // Caged candy: cannot be swapped but can be matched to break lock
  | 'chocolate'  // Chocolate block: spreads if none cleared
  | 'stone';     // Stone block: solid obstacle, must clear adjacent candy to destroy

// Jelly details
export type JellyType = 'none' | 'jelly1' | 'jelly2';

export interface CellState {
  candy: Candy | null;
  obstacle: ObstacleType;
  jelly: JellyType;
  isIngredient?: boolean; // True if it is a special collectible item (cherry/hazelnut)
}

export type BoardGrid = CellState[];

export interface Position {
  row: number;
  col: number;
}

// Game Modes
export type GameMode = 'moves' | 'timed' | 'challenge';

// Objectives
export interface Objective {
  type: 'score' | 'jelly' | 'color' | 'ingredient' | 'ice' | 'chocolate' | 'locked';
  target: number;
  current: number;
  colorNeeded?: CandyColor; // If objective type is 'color'
  ingredientType?: 'cherry' | 'hazelnut'; // If objective type is 'ingredient'
}

// Level Definition
export interface LevelConfig {
  levelNumber: number;
  worldNumber: number;
  worldName: string;
  themeColor: string; // Tailind class (e.g. 'from-pink-500')
  backgroundGradient: string; // CSS bg gradient class
  mode: GameMode;
  targetScore: number;
  starRatings: [number, number, number]; // Points needed for 1, 2, 3 stars
  limitValue: number; // Moves allowed or Time allowed (seconds)
  objectives: Objective[];
  initialObstacles?: { index: number; type: ObstacleType }[];
  initialJelly?: { index: number; type: JellyType }[];
  initialIngredients?: number[]; // Starting columns or indices for ingredients
}

// Active Level State
export interface GameStats {
  score: number;
  movesLeft: number;
  timeLeft: number; // in seconds, if timed mode
  stars: number;
  comboMultiplier: number;
}

// Boosters and Shop Power-Ups
export type BoosterType = 
  | 'hammer'            // Crack any tile
  | 'shuffle'           // Scramble board
  | 'extra-moves'       // Add 5 moves or 15 seconds
  | 'color-remover'     // Vaporize a selected color
  | 'bomb-booster';     // Create instant wrapped candy

export interface Booster {
  id: BoosterType;
  name: string;
  description: string;
  count: number;
  icon: string;
  coinCost: number;
}

// Screens
export type ActiveView = 'home' | 'map' | 'game' | 'stats' | 'leaderboard';

// User Persistent State
export interface UserProgress {
  levelsUnlocked: number;
  levelStars: Record<number, number>; // levelNumber -> stars achieved (1-3)
  highScores: Record<number, number>; // levelNumber -> score
  coins: number;
  boosters: Record<BoosterType, number>;
  lastDailyClaim: string | null; // Date ISO
  completedAchievements: string[]; // achievement IDs
  lives?: number;
  lastLifeRegenTime?: string | null; // Date ISO of last regen tick/start
}

// Achievement badges
export interface Achievement {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  icon: string;
  rewardCoins: number;
  isUnlocked: boolean;
}

// Leaderboard entries
export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  level: number;
  avatarColor: string;
  isPlayer?: boolean;
}

export interface MatchGroup {
  indices: number[];
  color: CandyColor;
  type: 'row' | 'col' | 'intersection';
}
