import { LevelConfig, CandyColor } from './types';

export const LEVEL_PRESETS: LevelConfig[] = [
  // ================= WORLD 1: CANDY KINGDOM =================
  {
    levelNumber: 1,
    worldNumber: 1,
    worldName: 'Candy Kingdom',
    themeColor: 'from-pink-500 to-purple-600',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-purple-950 to-pink-950',
    mode: 'moves',
    targetScore: 1000,
    starRatings: [800, 1500, 2500],
    limitValue: 20,
    objectives: [
      { type: 'score', target: 1000, current: 0 }
    ],
  },
  {
    levelNumber: 2,
    worldNumber: 1,
    worldName: 'Candy Kingdom',
    themeColor: 'from-pink-500 to-purple-600',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-purple-950 to-pink-950',
    mode: 'moves',
    targetScore: 1200,
    starRatings: [1000, 2000, 3500],
    limitValue: 18,
    objectives: [
      { type: 'jelly', target: 8, current: 0 }
    ],
    initialJelly: [
      { index: 27, type: 'jelly1' }, { index: 28, type: 'jelly1' },
      { index: 35, type: 'jelly1' }, { index: 36, type: 'jelly1' },
      { index: 19, type: 'jelly1' }, { index: 20, type: 'jelly1' },
      { index: 43, type: 'jelly1' }, { index: 44, type: 'jelly1' }
    ]
  },
  {
    levelNumber: 3,
    worldNumber: 1,
    worldName: 'Candy Kingdom',
    themeColor: 'from-pink-500 to-purple-600',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-purple-950 to-pink-950',
    mode: 'moves',
    targetScore: 1500,
    starRatings: [1200, 2500, 4000],
    limitValue: 18,
    objectives: [
      { type: 'color', target: 20, current: 0, colorNeeded: 'red' },
      { type: 'color', target: 20, current: 0, colorNeeded: 'blue' }
    ]
  },
  {
    levelNumber: 4,
    worldNumber: 1,
    worldName: 'Candy Kingdom',
    themeColor: 'from-pink-500 to-purple-600',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-purple-950 to-pink-950',
    mode: 'moves',
    targetScore: 1800,
    starRatings: [1500, 3000, 5000],
    limitValue: 17,
    objectives: [
      { type: 'ice', target: 6, current: 0 }
    ],
    initialObstacles: [
      { index: 18, type: 'ice1' }, { index: 21, type: 'ice1' },
      { index: 26, type: 'ice1' }, { index: 29, type: 'ice1' },
      { index: 34, type: 'ice1' }, { index: 37, type: 'ice1' }
    ]
  },
  {
    levelNumber: 5,
    worldNumber: 1,
    worldName: 'Candy Kingdom',
    themeColor: 'from-pink-500 to-purple-600',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-purple-950 to-pink-950',
    mode: 'moves',
    targetScore: 2000,
    starRatings: [1800, 3500, 6000],
    limitValue: 17,
    objectives: [
      { type: 'ingredient', target: 2, current: 0, ingredientType: 'cherry' }
    ],
    initialIngredients: [2, 5] // Columns to drop cherries in
  },

  // ================= WORLD 2: CHOCOLATE VALLEY =================
  {
    levelNumber: 6,
    worldNumber: 2,
    worldName: 'Chocolate Valley',
    themeColor: 'from-amber-600 to-orange-500',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-amber-950 to-orange-950',
    mode: 'moves',
    targetScore: 2500,
    starRatings: [2000, 4000, 7000],
    limitValue: 16,
    objectives: [
      { type: 'chocolate', target: 2, current: 0 }
    ],
    initialObstacles: [
      { index: 56, type: 'chocolate' }, { index: 63, type: 'chocolate' }
    ]
  },
  {
    levelNumber: 7,
    worldNumber: 2,
    worldName: 'Chocolate Valley',
    themeColor: 'from-amber-600 to-orange-500',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-amber-950 to-orange-950',
    mode: 'moves',
    targetScore: 2200,
    starRatings: [2000, 4500, 7500],
    limitValue: 16,
    objectives: [
      { type: 'color', target: 25, current: 0, colorNeeded: 'yellow' }
    ],
    // Let's place locked cages and countdown bomb obstacles
    initialObstacles: [
      { index: 27, type: 'locked' }, { index: 28, type: 'locked' },
      { index: 35, type: 'locked' }, { index: 36, type: 'locked' }
    ]
  },
  {
    levelNumber: 8,
    worldNumber: 2,
    worldName: 'Chocolate Valley',
    themeColor: 'from-amber-600 to-orange-500',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-amber-950 to-orange-950',
    mode: 'challenge',
    targetScore: 3000,
    starRatings: [2500, 5000, 8500],
    limitValue: 15,
    objectives: [
      { type: 'jelly', target: 12, current: 0 }
    ],
    initialJelly: [
      { index: 18, type: 'jelly2' }, { index: 19, type: 'jelly2' }, { index: 20, type: 'jelly2' }, { index: 21, type: 'jelly2' },
      { index: 26, type: 'jelly2' }, { index: 27, type: 'jelly2' }, { index: 28, type: 'jelly2' }, { index: 29, type: 'jelly2' },
      { index: 34, type: 'jelly2' }, { index: 35, type: 'jelly2' }, { index: 36, type: 'jelly2' }, { index: 37, type: 'jelly2' }
    ],
    initialObstacles: [
      { index: 19, type: 'chocolate' }, { index: 20, type: 'chocolate' }
    ]
  },
  {
    levelNumber: 9,
    worldNumber: 2,
    worldName: 'Chocolate Valley',
    themeColor: 'from-amber-600 to-orange-500',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-amber-950 to-orange-950',
    mode: 'moves',
    targetScore: 3200,
    starRatings: [3000, 5500, 9000],
    limitValue: 15,
    objectives: [
      { type: 'ingredient', target: 2, current: 0, ingredientType: 'hazelnut' },
      { type: 'ice', target: 4, current: 0 }
    ],
    initialObstacles: [
      { index: 58, type: 'ice2' }, { index: 59, type: 'ice2' },
      { index: 60, type: 'ice2' }, { index: 61, type: 'ice2' }
    ],
    initialIngredients: [3, 4]
  },
  {
    levelNumber: 10,
    worldNumber: 2,
    worldName: 'Chocolate Valley',
    themeColor: 'from-amber-600 to-orange-500',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-amber-950 to-orange-950',
    mode: 'challenge',
    targetScore: 4000,
    starRatings: [3500, 7000, 11000],
    limitValue: 14,
    objectives: [
      { type: 'jelly', target: 8, current: 0 },
      { type: 'color', target: 30, current: 0, colorNeeded: 'purple' }
    ],
    initialJelly: [
      { index: 24, type: 'jelly1' }, { index: 25, type: 'jelly1' }, { index: 26, type: 'jelly1' }, { index: 27, type: 'jelly1' },
      { index: 28, type: 'jelly1' }, { index: 29, type: 'jelly1' }, { index: 30, type: 'jelly1' }, { index: 31, type: 'jelly1' }
    ],
    initialObstacles: [
      { index: 24, type: 'locked' }, { index: 31, type: 'locked' },
      { index: 0, type: 'chocolate' }, { index: 7, type: 'chocolate' }
    ]
  },

  // ================= WORLD 3: ICE GLACIERS =================
  {
    levelNumber: 11,
    worldNumber: 3,
    worldName: 'Ice Glaciers',
    themeColor: 'from-cyan-500 to-indigo-600',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-cyan-950 to-indigo-950',
    mode: 'moves',
    targetScore: 4500,
    starRatings: [4000, 7500, 12000],
    limitValue: 15,
    objectives: [
      { type: 'ice', target: 12, current: 0 }
    ],
    initialObstacles: [
      { index: 9, type: 'ice2' }, { index: 14, type: 'ice2' },
      { index: 17, type: 'ice2' }, { index: 22, type: 'ice2' },
      { index: 25, type: 'ice2' }, { index: 30, type: 'ice2' },
      { index: 33, type: 'ice2' }, { index: 38, type: 'ice2' },
      { index: 41, type: 'ice2' }, { index: 46, type: 'ice2' },
      { index: 49, type: 'ice2' }, { index: 54, type: 'ice2' }
    ]
  },
  {
    levelNumber: 12,
    worldNumber: 3,
    worldName: 'Ice Glaciers',
    themeColor: 'from-cyan-500 to-indigo-600',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-cyan-950 to-indigo-950',
    mode: 'moves',
    targetScore: 3500,
    starRatings: [3000, 6000, 10000],
    limitValue: 15,
    objectives: [
      { type: 'jelly', target: 16, current: 0 }
    ],
    initialJelly: [
      { index: 40, type: 'jelly1' }, { index: 41, type: 'jelly1' }, { index: 42, type: 'jelly1' }, { index: 43, type: 'jelly1' },
      { index: 44, type: 'jelly1' }, { index: 45, type: 'jelly1' }, { index: 46, type: 'jelly1' }, { index: 47, type: 'jelly1' },
      { index: 48, type: 'jelly1' }, { index: 49, type: 'jelly1' }, { index: 50, type: 'jelly1' }, { index: 51, type: 'jelly1' },
      { index: 52, type: 'jelly1' }, { index: 53, type: 'jelly1' }, { index: 54, type: 'jelly1' }, { index: 55, type: 'jelly1' }
    ],
    initialObstacles: [
      { index: 42, type: 'stone' }, { index: 45, type: 'stone' },
      { index: 50, type: 'stone' }, { index: 53, type: 'stone' }
    ]
  },
  {
    levelNumber: 13,
    worldNumber: 3,
    worldName: 'Ice Glaciers',
    themeColor: 'from-cyan-500 to-indigo-600',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-cyan-950 to-indigo-950',
    mode: 'challenge',
    targetScore: 5000,
    starRatings: [4500, 8000, 14000],
    limitValue: 14,
    objectives: [
      { type: 'chocolate', target: 2, current: 0 }
    ],
    initialObstacles: [
      { index: 27, type: 'stone' }, { index: 28, type: 'stone' },
      { index: 35, type: 'stone' }, { index: 36, type: 'stone' },
      { index: 12, type: 'chocolate' }, { index: 19, type: 'chocolate' }
    ]
  },
  {
    levelNumber: 14,
    worldNumber: 3,
    worldName: 'Ice Glaciers',
    themeColor: 'from-cyan-500 to-indigo-600',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-cyan-950 to-indigo-950',
    mode: 'moves',
    targetScore: 5500,
    starRatings: [5000, 9000, 15000],
    limitValue: 14,
    objectives: [
      { type: 'color', target: 35, current: 0, colorNeeded: 'green' }
    ],
    initialObstacles: [
      { index: 11, type: 'locked' }, { index: 12, type: 'locked' },
      { index: 51, type: 'locked' }, { index: 52, type: 'locked' },
      { index: 56, type: 'chocolate' }, { index: 63, type: 'chocolate' }
    ]
  },
  {
    levelNumber: 15,
    worldNumber: 3,
    worldName: 'Ice Glaciers',
    themeColor: 'from-cyan-500 to-indigo-600',
    backgroundGradient: 'bg-gradient-to-b from-slate-950 via-cyan-950 to-indigo-950',
    mode: 'challenge',
    targetScore: 6000,
    starRatings: [5000, 10000, 18000],
    limitValue: 16,
    objectives: [
      { type: 'jelly', target: 8, current: 0 },
      { type: 'ice', target: 8, current: 0 },
      { type: 'ingredient', target: 2, current: 0, ingredientType: 'cherry' }
    ],
    initialJelly: [
      { index: 18, type: 'jelly2' }, { index: 19, type: 'jelly2' }, { index: 20, type: 'jelly2' }, { index: 21, type: 'jelly2' },
      { index: 26, type: 'jelly2' }, { index: 27, type: 'jelly2' }, { index: 28, type: 'jelly2' }, { index: 29, type: 'jelly2' }
    ],
    initialObstacles: [
      { index: 42, type: 'stone' }, { index: 45, type: 'stone' },
      { index: 18, type: 'ice2' }, { index: 19, type: 'ice2' },
      { index: 20, type: 'ice2' }, { index: 21, type: 'ice2' },
      { index: 26, type: 'ice2' }, { index: 27, type: 'ice2' },
      { index: 28, type: 'ice2' }, { index: 29, type: 'ice2' }
    ],
    initialIngredients: [1, 6]
  }
];
