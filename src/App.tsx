import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Candy, 
  BoardGrid, 
  GameStats, 
  Booster, 
  BoosterType, 
  CandyColor, 
  CandyType, 
  MatchGroup, 
  ActiveView, 
  UserProgress, 
  Achievement, 
  LeaderboardEntry,
  LevelConfig
} from './types';
import { HomeScreen } from './components/HomeScreen';
import { LevelMap } from './components/LevelMap';
import { CandyBoard } from './components/CandyBoard';
import { ScoreBoard } from './components/ScoreBoard';
import { Boosters } from './components/Boosters';
import { LEVEL_PRESETS } from './levels';
import { 
  initializeBoardForLevel, 
  checkForMatches, 
  isValidSwap, 
  isMovePossible, 
  findHintMove, 
  shuffleBoard, 
  createRandomCandy,
  spreadChocolate,
  generateId 
} from './gameLogic';
import { 
  initAudio, 
  playClickSound, 
  playSwapSound, 
  playMatchSound, 
  playBoosterSound, 
  playLevelUpSound, 
  playGameOverSound,
  playObstacleBreakSound,
  startBgmLoop,
  stopBgmLoop
} from './audio';
import { HelpCircle, RefreshCw, Trophy, Info, Sparkles, X, RotateCcw, Volume2, Coins, Heart } from 'lucide-react';

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

const DEFAULT_PROGRESS: UserProgress = {
  levelsUnlocked: 1,
  levelStars: {},
  highScores: {},
  coins: 500,
  boosters: {
    'hammer': 3,
    'shuffle': 2,
    'extra-moves': 2,
    'color-remover': 1,
    'bomb-booster': 1,
  },
  lastDailyClaim: null,
  completedAchievements: [],
  lives: 5,
  lastLifeRegenTime: null,
};

const COLOR_HEX: Record<CandyColor, string> = {
  red: '#ff4d6d',
  blue: '#00f5ff',
  green: '#00ff88',
  yellow: '#fffb00',
  orange: '#ffaa00',
  purple: '#d000ff',
};

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_match', title: 'Sugar Rush', description: 'Complete your first candy match', target: 1, current: 0, icon: '🍬', rewardCoins: 50, isUnlocked: false },
  { id: 'level_5', title: 'Candy Baron', description: 'Unlock Level 5 in your sweet journey', target: 5, current: 1, icon: '👑', rewardCoins: 150, isUnlocked: false },
  { id: 'jelly_cleared', title: 'Slick & Clean', description: 'Dissolve 25 sticky Jelly tiles', target: 25, current: 0, icon: '🧼', rewardCoins: 100, isUnlocked: false },
  { id: 'gold_collector', title: 'Treasure Master', description: 'Accumulate 1,000 gold coins', target: 1000, current: 500, icon: '🪙', rewardCoins: 200, isUnlocked: false },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Tiffi Candy', score: 25000, level: 12, avatarColor: 'bg-pink-400' },
  { rank: 2, name: 'Mr. Toffee', score: 18400, level: 9, avatarColor: 'bg-amber-400' },
  { rank: 3, name: 'Yeti Hugs', score: 12500, level: 6, avatarColor: 'bg-blue-400' },
  { rank: 4, name: 'SweetPlayer', score: 0, level: 1, avatarColor: 'bg-indigo-400', isPlayer: true },
  { rank: 5, name: 'Bubble Gum', score: 4500, level: 3, avatarColor: 'bg-purple-400' },
];

const calculateStars = (score: number, ratings: [number, number, number]): number => {
  if (score >= ratings[2]) return 3;
  if (score >= ratings[1]) return 2;
  if (score >= ratings[0]) return 1;
  return 0;
};

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<ActiveView>('home');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800); // 2.8 seconds splash screen duration
    return () => clearTimeout(timer);
  }, []);

  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);

  // Active game level states
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig | null>(null);
  const [board, setBoard] = useState<BoardGrid>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedBooster, setSelectedBooster] = useState<BoosterType | null>(null);
  
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    movesLeft: 20,
    timeLeft: 60,
    stars: 0,
    comboMultiplier: 1,
  });

  // Animation lock and interactive elements
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);
  const [showLevelClear, setShowLevelClear] = useState<boolean>(false);
  const [hasClearedCurrentSession, setHasClearedCurrentSession] = useState<boolean>(false);
  const [hasRewardedSession, setHasRewardedSession] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Inactivity / Hint timers
  const [hintIndices, setHintIndices] = useState<[number, number] | null>(null);
  const inactivityTimerRef = useRef<any>(null);

  // Particle canvas references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isTickRunningRef = useRef<boolean>(false);

  const startTickIfNeeded = () => {
    if (isTickRunningRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isTickRunningRef.current = true;

    const tick = () => {
      if (!canvasRef.current || particlesRef.current.length === 0) {
        isTickRunningRef.current = false;
        if (canvasRef.current) {
          const cleanCtx = canvasRef.current.getContext('2d');
          if (cleanCtx) {
            cleanCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
        return;
      }

      const currentCtx = canvasRef.current.getContext('2d');
      if (!currentCtx) {
        isTickRunningRef.current = false;
        return;
      }

      currentCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // soft gravity
        p.life -= 0.025; // life decay
        p.size *= 0.97; // gradual shrink

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        currentCtx.save();
        currentCtx.globalAlpha = p.life;
        currentCtx.beginPath();
        currentCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        currentCtx.fillStyle = p.color;
        currentCtx.fill();
        currentCtx.restore();
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  // Count matches metrics for achievements
  const totalMatchesCountRef = useRef<number>(0);

  // Lives regeneration state & tracking
  const [regenCountdown, setRegenCountdown] = useState<string>('');
  const hasDeductedLifeRef = useRef<boolean>(false);
  const isTransitioningRef = useRef<boolean>(false);

  // Initial Load Progress
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const savedProg = localStorage.getItem('sweet_candy_progress');
        if (savedProg) {
          const parsed = JSON.parse(savedProg);
          const merged = {
            ...DEFAULT_PROGRESS,
            ...parsed,
          };
          setProgress(merged);
          
          // Sync Achievements and Leaderboard
          syncStatsAndAchievements(merged);
        }
      } catch (e) {
        // Safe fail
      }
    }

    // Trigger BGM loops on click
    const unlockAudio = () => {
      initAudio();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      stopBgmLoop();
    };
  }, []);

  // Timed Level Countdown ticks
  useEffect(() => {
    let timerId: any = null;
    if (currentView === 'game' && selectedLevel?.mode === 'timed' && !isPaused && !showGameOver && !showLevelClear) {
      timerId = setInterval(() => {
        setGameStats((prev) => {
          if (prev.timeLeft <= 1) {
            clearInterval(timerId);
            const reachedTargetScore = prev.score >= selectedLevel.targetScore;
            const objectivesCompleted = selectedLevel.objectives.every(obj => {
              if (obj.type === 'score') return prev.score >= obj.target;
              return obj.current >= obj.target;
            });

            const isLevel1 = selectedLevel.levelNumber === 1;
            const canComplete = isLevel1 ? reachedTargetScore : (reachedTargetScore && objectivesCompleted);

            if (canComplete || hasClearedCurrentSession) {
              setTimeout(() => {
                playLevelUpSound();
                setShowLevelClear(true);

                const starsAchieved = calculateStars(prev.score, selectedLevel.starRatings);
                const updatedStars = { ...progress.levelStars, [selectedLevel.levelNumber]: Math.max(progress.levelStars[selectedLevel.levelNumber] || 0, starsAchieved) };
                const updatedScores = { ...progress.highScores, [selectedLevel.levelNumber]: Math.max(progress.highScores[selectedLevel.levelNumber] || 0, prev.score) };
                
                const nextUnlocked = Math.max(progress.levelsUnlocked, selectedLevel.levelNumber + 1);

                const isAlreadyCompleted = progress.levelStars[selectedLevel.levelNumber] !== undefined;
                const coinsReward = (hasRewardedSession || isAlreadyCompleted) ? 0 : 100;
                setHasRewardedSession(true);

                handleUpdateProgress({
                  ...progress,
                  levelsUnlocked: nextUnlocked,
                  levelStars: updatedStars,
                  highScores: updatedScores,
                  coins: progress.coins + coinsReward,
                });
              }, 400);
            } else {
              setTimeout(() => {
                playGameOverSound();
                setShowGameOver(true);
              }, 400);
            }
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [currentView, selectedLevel, isPaused, showGameOver, showLevelClear, progress, hasClearedCurrentSession, hasRewardedSession]);

  // Continuous check for level completion
  useEffect(() => {
    if (!selectedLevel || currentView !== 'game' || hasClearedCurrentSession) return;

    const reachedTargetScore = gameStats.score >= selectedLevel.targetScore;
    const objectivesCompleted = selectedLevel.objectives.every(obj => {
      if (obj.type === 'score') return gameStats.score >= obj.target;
      return obj.current >= obj.target;
    });

    const isLevel1 = selectedLevel.levelNumber === 1;
    const canComplete = isLevel1 ? reachedTargetScore : (reachedTargetScore && objectivesCompleted);

    if (canComplete) {
      setHasClearedCurrentSession(true);
      setIsPaused(true);
      setShowLevelClear(true);
      
      // Award progress success immediately
      playLevelUpSound();

      const starsAchieved = calculateStars(gameStats.score, selectedLevel.starRatings);
      const updatedStars = { 
        ...progress.levelStars, 
        [selectedLevel.levelNumber]: Math.max(progress.levelStars[selectedLevel.levelNumber] || 0, starsAchieved) 
      };
      const updatedScores = { 
        ...progress.highScores, 
        [selectedLevel.levelNumber]: Math.max(progress.highScores[selectedLevel.levelNumber] || 0, gameStats.score) 
      };
      const nextUnlocked = Math.max(progress.levelsUnlocked, selectedLevel.levelNumber + 1);

      const isAlreadyCompleted = progress.levelStars[selectedLevel.levelNumber] !== undefined;
      const coinsReward = (hasRewardedSession || isAlreadyCompleted) ? 0 : 100;
      setHasRewardedSession(true);

      handleUpdateProgress({
        ...progress,
        levelsUnlocked: nextUnlocked,
        levelStars: updatedStars,
        highScores: updatedScores,
        coins: progress.coins + coinsReward,
      });
    }
  }, [gameStats.score, selectedLevel, currentView, hasClearedCurrentSession, progress, hasRewardedSession]);

  // Hint finder activity manager
  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [board, selectedIndex, currentView]);

  // High Performance Canvas Sparkle particle loops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const boardEl = document.getElementById('candy-board');
      if (boardEl && canvas) {
        canvas.width = boardEl.clientWidth;
        canvas.height = boardEl.clientHeight;
        if (particlesRef.current.length > 0) {
          startTickIfNeeded();
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [currentView, selectedLevel]);

  // Sync state data for achievements
  const syncStatsAndAchievements = (progData: UserProgress) => {
    // Achievements list updates
    setAchievements((prev) => {
      return prev.map((item) => {
        let current = 0;
        if (item.id === 'first_match') current = totalMatchesCountRef.current;
        if (item.id === 'level_5') current = progData.levelsUnlocked;
        if (item.id === 'jelly_cleared') {
          // Accumulate jelly cleared across levels
          current = Math.min(item.target, Math.floor(totalMatchesCountRef.current * 0.4));
        }
        if (item.id === 'gold_collector') current = progData.coins;

        const isUnlocked = current >= item.target;
        return {
          ...item,
          current,
          isUnlocked,
        };
      });
    });

    // Leaderboard players ranking update
    setLeaderboard((prev) => {
      const highestScoreVal = Math.max(...Object.values(progData.highScores), 0);
      return prev.map((user) => {
        if (user.isPlayer) {
          return {
            ...user,
            score: highestScoreVal,
            level: progData.levelsUnlocked,
          };
        }
        return user;
      }).sort((a, b) => b.score - a.score)
        .map((user, idx) => ({ ...user, rank: idx + 1 }));
    });
  };

  const handleUpdateProgress = (updated: UserProgress) => {
    setProgress(updated);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('sweet_candy_progress', JSON.stringify(updated));
      } catch (e) {
        // safe
      }
    }
    syncStatsAndAchievements(updated);
  };

  const deductLife = () => {
    if (hasDeductedLifeRef.current) return;
    hasDeductedLifeRef.current = true;
    
    const currentLives = progress.lives !== undefined ? progress.lives : 5;
    const nextLives = Math.max(0, currentLives - 1);
    const nextRegenTime = currentLives === 5 ? new Date().toISOString() : progress.lastLifeRegenTime;
    
    const updated = {
      ...progress,
      lives: nextLives,
      lastLifeRegenTime: nextRegenTime,
    };
    
    setProgress(updated);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('sweet_candy_progress', JSON.stringify(updated));
      } catch (e) {
        // safe
      }
    }
    syncStatsAndAchievements(updated);
  };

  // Lives regeneration effect (1 life every 30 minutes, stored in local storage)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLives = progress.lives !== undefined ? progress.lives : 5;
      if (currentLives >= 5) {
        setRegenCountdown('');
        return;
      }

      let lastRegenStr = progress.lastLifeRegenTime;
      if (!lastRegenStr) {
        lastRegenStr = new Date().toISOString();
        const updated = {
          ...progress,
          lastLifeRegenTime: lastRegenStr,
        };
        setProgress(updated);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('sweet_candy_progress', JSON.stringify(updated));
          } catch (e) {}
        }
        return;
      }

      const lastRegenTime = new Date(lastRegenStr).getTime();
      const now = Date.now();
      const diffMs = now - lastRegenTime;
      const regenPeriodMs = 30 * 60 * 1000; // 30 minutes

      if (diffMs >= regenPeriodMs) {
        const livesToGain = Math.floor(diffMs / regenPeriodMs);
        const nextLives = Math.min(5, currentLives + livesToGain);
        const nextRegenTime = nextLives >= 5 ? null : new Date(lastRegenTime + livesToGain * regenPeriodMs).toISOString();

        const updated = {
          ...progress,
          lives: nextLives,
          lastLifeRegenTime: nextRegenTime,
        };
        setProgress(updated);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('sweet_candy_progress', JSON.stringify(updated));
          } catch (e) {}
        }
        syncStatsAndAchievements(updated);
      } else {
        const remainingMs = regenPeriodMs - diffMs;
        const totalSecs = Math.max(0, Math.floor(remainingMs / 1000));
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setRegenCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [progress.lives, progress.lastLifeRegenTime]);

  // Deduct a life when showGameOver changes to true
  useEffect(() => {
    if (showGameOver) {
      deductLife();
    }
  }, [showGameOver]);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    setHintIndices(null);

    if (currentView !== 'game' || isAnimating || isPaused) return;

    inactivityTimerRef.current = setTimeout(() => {
      // Find possible moves and hint
      const hint = findHintMove(board);
      if (hint) {
        setHintIndices(hint);
      }
    }, 5000); // hint after 5 seconds
  };

  const spawnParticles = (index: number, color: CandyColor | 'ice' | 'jelly' | 'stone') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const row = Math.floor(index / 8);
    const col = index % 8;
    const cellW = canvas.width / 8;
    const cellH = canvas.height / 8;

    const x = col * cellW + cellW / 2;
    const y = row * cellH + cellH / 2;

    let pColor = '#ffffff';
    if (color === 'ice') pColor = '#a5f3fc';
    else if (color === 'jelly') pColor = '#22d3ee';
    else if (color === 'stone') pColor = '#64748b';
    else pColor = COLOR_HEX[color] || '#ff007f';

    for (let k = 0; k < 12; k++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5;
      particlesRef.current.push({
        id: generateId(),
        x,
        y,
        color: k % 3 === 0 ? '#ffffff' : pColor,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        life: 0.9,
        size: 2.5 + Math.random() * 4,
      });
    }
    startTickIfNeeded();
  };

  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 2500);
  };

  // Setup/Start a Game Level config
  const handleLaunchLevel = (levelNum: number) => {
    const levelConf = LEVEL_PRESETS.find((l) => l.levelNumber === levelNum) || LEVEL_PRESETS[0];
    setSelectedLevel(levelConf);

    // Initialize state
    hasDeductedLifeRef.current = false;
    const initialBoard = initializeBoardForLevel(levelConf);
    setBoard(initialBoard);
    setSelectedIndex(null);
    setSelectedBooster(null);

    setGameStats({
      score: 0,
      movesLeft: levelConf.limitValue,
      timeLeft: levelConf.mode === 'timed' ? levelConf.limitValue : 60,
      stars: 0,
      comboMultiplier: 1,
    });

    setIsPaused(false);
    setIsAnimating(false);
    setShowGameOver(false);
    setShowLevelClear(false);
    setHasClearedCurrentSession(false);
    setHasRewardedSession(false);
    setCurrentView('game');
    startBgmLoop();
  };

  // Handle transitions to the next level smoothly with progress saving
  const handleNextLevel = () => {
    if (!selectedLevel) return;
    playClickSound();

    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    // Now transition to the next level
    const nextLvlNum = selectedLevel.levelNumber + 1;
    const hasNextLvl = LEVEL_PRESETS.some(l => l.levelNumber === nextLvlNum);

    setTimeout(() => {
      isTransitioningRef.current = false;
      if (hasNextLvl) {
        handleLaunchLevel(nextLvlNum);
      } else {
        setShowLevelClear(false);
        setHasClearedCurrentSession(false);
        setCurrentView('map');
        stopBgmLoop();
      }
    }, 150);
  };

  // Evaluate and Damage Obstacles surrounding a matched center
  const processObstacleClearing = (workingBoard: BoardGrid, clearedIndices: number[]): boolean => {
    let obstacleDestroyedThisTurn = false;
    let chocolateDestroyedThisTurn = false;

    const clearedSet = new Set(clearedIndices);

    // Scan adjacent blocks to all matched indices
    clearedIndices.forEach((idx) => {
      const row = Math.floor(idx / 8);
      const col = idx % 8;

      const adjacent = [
        { r: row - 1, c: col },
        { r: row + 1, c: col },
        { r: row, c: col - 1 },
        { r: row, c: col + 1 },
      ];

      adjacent.forEach(({ r, c }) => {
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const adjIdx = r * 8 + c;
          const cell = workingBoard[adjIdx];

          // Melt Ice blocks
          if (cell.obstacle === 'ice2') {
            cell.obstacle = 'ice1';
            spawnParticles(adjIdx, 'ice');
            playObstacleBreakSound();
            obstacleDestroyedThisTurn = true;
          } else if (cell.obstacle === 'ice1') {
            cell.obstacle = 'none';
            spawnParticles(adjIdx, 'ice');
            playObstacleBreakSound();
            obstacleDestroyedThisTurn = true;

            // Increment Ice objective targets
            updateObjectiveProgress('ice', 1);
          }

          // Crushing adjacent chocolate blocks
          if (cell.obstacle === 'chocolate') {
            cell.obstacle = 'none';
            spawnParticles(adjIdx, 'stone');
            playObstacleBreakSound();
            chocolateDestroyedThisTurn = true;
            obstacleDestroyedThisTurn = true;
          }

          // Crushing adjacent stones
          if (cell.obstacle === 'stone') {
            cell.obstacle = 'none';
            spawnParticles(adjIdx, 'stone');
            playObstacleBreakSound();
            obstacleDestroyedThisTurn = true;
          }
        }
      });
    });

    // Check Cage breaking (Matched items themselves are freed from locks)
    clearedIndices.forEach((idx) => {
      const cell = workingBoard[idx];
      if (cell && cell.obstacle === 'locked') {
        cell.obstacle = 'none';
        spawnParticles(idx, 'stone');
        playObstacleBreakSound();
        obstacleDestroyedThisTurn = true;

        // Ensure candy remains (locked candies matched are freed first, not destroyed in the same turn)
        clearedSet.delete(idx);
      }

      // Clear Jelly overlays under matched candies
      if (cell && cell.jelly !== 'none') {
        if (cell.jelly === 'jelly2') {
          cell.jelly = 'jelly1';
        } else {
          cell.jelly = 'none';
          updateObjectiveProgress('jelly', 1);
        }
        spawnParticles(idx, 'jelly');
        playObstacleBreakSound();
        obstacleDestroyedThisTurn = true;
      }
    });

    return chocolateDestroyedThisTurn;
  };

  const updateObjectiveProgress = (type: string, amount: number, color?: CandyColor) => {
    if (!selectedLevel) return;

    setSelectedLevel((prev) => {
      if (!prev) return null;
      const updatedObjectives = prev.objectives.map((obj) => {
        if (obj.type === type) {
          if (type === 'color' && obj.colorNeeded !== color) return obj;
          return {
            ...obj,
            current: Math.min(obj.target, obj.current + amount),
          };
        }
        return obj;
      });
      return {
        ...prev,
        objectives: updatedObjectives,
      };
    });
  };

  // Evaluate Cherry Escorts arriving at bottom row
  const processEscorts = (workingBoard: BoardGrid): boolean => {
    let escortsHappened = false;
    for (let c = 0; c < 8; c++) {
      const idx = 56 + c; // bottom row
      const cell = workingBoard[idx];
      if (cell && cell.isIngredient) {
        // Safely Escorted!
        workingBoard[idx].isIngredient = false;
        spawnParticles(idx, 'jelly');
        playLevelUpSound();
        updateObjectiveProgress('ingredient', 1);
        escortsHappened = true;
      }
    }
    return escortsHappened;
  };

  // Sweep matches and invoke cascades
  const resolveBoardMatches = async (
    currentBoard: BoardGrid, 
    matches: MatchGroup[], 
    comboMultiplier: number = 1
  ) => {
    let workingBoard = currentBoard.map(c => ({ ...c }));
    let matchScorePoints = 0;
    const finalCleared: number[] = [];

    // Track spawn of special candies
    const specialSpawns: { index: number; color: CandyColor; type: CandyType }[] = [];

    matches.forEach((m) => {
      const size = m.indices.length;
      matchScorePoints += size * 50 * comboMultiplier;

      m.indices.forEach((idx) => {
        finalCleared.push(idx);
        const cell = workingBoard[idx];
        if (cell && cell.candy) {
          spawnParticles(idx, cell.candy.color);
          
          // Increment Color objective targets
          updateObjectiveProgress('color', 1, cell.candy.color);
        }
      });

      // Spawn Specials
      const spawnIdx = m.indices[Math.floor(size / 2)];
      if (size >= 5) {
        specialSpawns.push({ index: spawnIdx, color: m.color, type: 'color-bomb' });
      } else if (size === 4) {
        const type: CandyType = m.type === 'row' ? 'striped-col' : 'striped-row';
        specialSpawns.push({ index: spawnIdx, color: m.color, type });
      } else if (m.type === 'intersection') {
        specialSpawns.push({ index: spawnIdx, color: m.color, type: 'wrapped' });
      }
    });

    // Damage Obstacles surrounding matched candies
    const chocolateCleared = processObstacleClearing(workingBoard, finalCleared);

    // Recursively handle any secondary special candy blasts (striped/wrapped)
    const recursiveClearedSet = new Set(finalCleared);
    const queue = [...finalCleared];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const cell = workingBoard[curr];
      if (!cell || !cell.candy) continue;

      if (cell.candy.type === 'striped-row') {
        const row = Math.floor(curr / 8);
        for (let c = 0; c < 8; c++) {
          const checkIdx = row * 8 + c;
          if (workingBoard[checkIdx] && !recursiveClearedSet.has(checkIdx)) {
            recursiveClearedSet.add(checkIdx);
            queue.push(checkIdx);
          }
        }
      }

      if (cell.candy.type === 'striped-col') {
        const col = curr % 8;
        for (let r = 0; r < 8; r++) {
          const checkIdx = r * 8 + col;
          if (workingBoard[checkIdx] && !recursiveClearedSet.has(checkIdx)) {
            recursiveClearedSet.add(checkIdx);
            queue.push(checkIdx);
          }
        }
      }

      if (cell.candy.type === 'wrapped') {
        const row = Math.floor(curr / 8);
        const col = curr % 8;
        for (let r = Math.max(0, row - 1); r <= Math.min(7, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
            const checkIdx = r * 8 + c;
            if (workingBoard[checkIdx] && !recursiveClearedSet.has(checkIdx)) {
              recursiveClearedSet.add(checkIdx);
              queue.push(checkIdx);
            }
          }
        }
      }
    }

    const finalExplodedArr = Array.from(recursiveClearedSet);

    // Vaporize all candies inside cleared tiles
    finalExplodedArr.forEach((idx) => {
      if (workingBoard[idx]) {
        workingBoard[idx].candy = null;
      }
    });

    // Populate the newly spawned special candies
    specialSpawns.forEach((spawn) => {
      if (workingBoard[spawn.index] && !workingBoard[spawn.index].candy) {
        workingBoard[spawn.index].candy = createRandomCandy(
          spawn.type === 'color-bomb' ? undefined : spawn.color,
          spawn.type
        );
      }
    });

    totalMatchesCountRef.current += matches.length;

    // Check Escorts before Cascade
    processEscorts(workingBoard);

    // Update board and score
    setBoard(workingBoard);
    setGameStats((prev) => ({
      ...prev,
      score: prev.score + matchScorePoints,
      comboMultiplier,
    }));

    // Delay briefly to show match pop
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Cascade refill gravity fall
    cascadeRefillCycle(workingBoard, comboMultiplier + 1, chocolateCleared);
  };

  const cascadeRefillCycle = async (
    currentBoard: BoardGrid, 
    nextCombo: number,
    chocolateCleared: boolean
  ) => {
    setIsAnimating(true);
    let workingBoard = currentBoard.map(c => ({ ...c }));

    // 1. Shift cells down (gravity)
    for (let col = 0; col < 8; col++) {
      let emptySpot = 7;
      for (let row = 7; row >= 0; row--) {
        const idx = row * 8 + col;
        if (workingBoard[idx].obstacle === 'stone') {
          // Stones do not shift, and block flow
          continue;
        }

        if (workingBoard[idx].candy !== null || workingBoard[idx].isIngredient) {
          const targetIdx = emptySpot * 8 + col;
          if (targetIdx !== idx) {
            workingBoard[targetIdx].candy = workingBoard[idx].candy;
            workingBoard[targetIdx].isIngredient = workingBoard[idx].isIngredient;

            workingBoard[idx].candy = null;
            workingBoard[idx].isIngredient = false;
          }
          emptySpot--;
        }
      }

      // 2. Spawn fresh candy replacements at top row
      for (let row = emptySpot; row >= 0; row--) {
        const idx = row * 8 + col;
        if (workingBoard[idx].obstacle !== 'stone') {
          workingBoard[idx].candy = createRandomCandy();
        }
      }
    }

    setBoard(workingBoard);

    // Slide animation delay
    await new Promise((resolve) => setTimeout(resolve, 380));

    // Check Escorts post-gravity
    const escortsEscaped = processEscorts(workingBoard);
    if (escortsEscaped) {
      setBoard([...workingBoard]);
    }

    // 3. Scan for matches formed by the cascade
    const cascadeMatches = checkForMatches(workingBoard);

    if (cascadeMatches.length > 0) {
      playMatchSound(nextCombo);
      resolveBoardMatches(workingBoard, cascadeMatches, nextCombo);
    } else {
      // Board fully settled!
      // If chocolates exist and no chocolate cleared this turn, chocolate spreads!
      if (selectedLevel && !chocolateCleared) {
        workingBoard = spreadChocolate(workingBoard);
        setBoard(workingBoard);
      }

      setGameStats((prev) => ({ ...prev, comboMultiplier: 1 }));
      setIsAnimating(false);

      // Verify Level success or failure outcomes
      checkLevelEndingConditions(workingBoard);
    }
  };

  const checkLevelEndingConditions = (currentBoard: BoardGrid) => {
    if (!selectedLevel) return;
    if (hasClearedCurrentSession) return;

    const reachedTargetScore = gameStats.score >= selectedLevel.targetScore;
    const objectivesCompleted = selectedLevel.objectives.every(obj => {
      if (obj.type === 'score') return gameStats.score >= obj.target;
      return obj.current >= obj.target;
    });

    const isLevel1 = selectedLevel.levelNumber === 1;
    const canComplete = isLevel1 ? reachedTargetScore : (reachedTargetScore && objectivesCompleted);

    // Check Failures or Success when Moves/Time are depleted
    const isMovesDepleted = selectedLevel.mode !== 'timed' && gameStats.movesLeft <= 0;
    const isTimeDepleted = selectedLevel.mode === 'timed' && gameStats.timeLeft <= 0;

    if (isMovesDepleted || isTimeDepleted) {
      if (canComplete) {
        // SUCCESS: The player completed the level!
        setHasClearedCurrentSession(true);
        setIsPaused(true);
        setShowLevelClear(true);
        playLevelUpSound();

        const starsAchieved = calculateStars(gameStats.score, selectedLevel.starRatings);
        const updatedStars = { ...progress.levelStars, [selectedLevel.levelNumber]: Math.max(progress.levelStars[selectedLevel.levelNumber] || 0, starsAchieved) };
        const updatedScores = { ...progress.highScores, [selectedLevel.levelNumber]: Math.max(progress.highScores[selectedLevel.levelNumber] || 0, gameStats.score) };
        const nextUnlocked = Math.max(progress.levelsUnlocked, selectedLevel.levelNumber + 1);

        const isAlreadyCompleted = progress.levelStars[selectedLevel.levelNumber] !== undefined;
        const coinsReward = (hasRewardedSession || isAlreadyCompleted) ? 0 : 100;
        setHasRewardedSession(true);

        handleUpdateProgress({
          ...progress,
          levelsUnlocked: nextUnlocked,
          levelStars: updatedStars,
          highScores: updatedScores,
          coins: progress.coins + coinsReward,
        });
      } else {
        // FAILURE: Truly ran out of moves without reaching the target score
        setTimeout(() => {
          playGameOverSound();
          setShowGameOver(true);
        }, 400);
      }
      return;
    }

    // Check Deadlocks -> Auto-Shuffle
    if (!isMovePossible(currentBoard)) {
      setTimeout(() => {
        triggerAlert("No moves left! Shuffling board...");
        const shuffled = shuffleBoard(currentBoard);
        setBoard(shuffled);
        playBoosterSound();
      }, 500);
    }
  };

  // Perform adjacent swappings
  const handleSwap = async (indexA: number, indexB: number) => {
    setIsAnimating(true);
    setSelectedIndex(null);

    let workingBoard = board.map(c => ({ ...c }));
    const candyA = workingBoard[indexA].candy;
    const candyB = workingBoard[indexB].candy;

    if (!candyA && !candyB) {
      setIsAnimating(false);
      return;
    }

    // Swapping
    workingBoard[indexA].candy = candyB;
    workingBoard[indexB].candy = candyA;

    // Handle ingredient swaps correctly
    const ingA = workingBoard[indexA].isIngredient;
    const ingB = workingBoard[indexB].isIngredient;
    workingBoard[indexA].isIngredient = ingB;
    workingBoard[indexB].isIngredient = ingA;

    setBoard(workingBoard);
    playSwapSound();

    await new Promise((resolve) => setTimeout(resolve, 250));

    // Color Bomb combinatorics checks
    const hasColorBomb = (candyA?.type === 'color-bomb') || (candyB?.type === 'color-bomb');

    if (hasColorBomb && selectedLevel) {
      let targetColor: CandyColor | null = null;

      if (candyA?.type === 'color-bomb' && candyB) {
        targetColor = candyB.color;
      } else if (candyB?.type === 'color-bomb' && candyA) {
        targetColor = candyA.color;
      } else if (candyA?.type === 'color-bomb' && candyB?.type === 'color-bomb') {
        // Super bomb combo! Vaporize entire board
        triggerAlert("SUPER BOMB COMBO!");
        playMatchSound(3);

        const allInList = Array.from({ length: 64 }, (_, i) => i);
        setGameStats((p) => ({ ...p, movesLeft: p.movesLeft - 1 }));
        resolveBoardMatches(workingBoard, [{ indices: allInList, color: 'red', type: 'row' }], 2);
        return;
      }

      if (targetColor) {
        const bombIdx = candyA?.type === 'color-bomb' ? indexA : indexB;
        const listToClear = [bombIdx];

        for (let i = 0; i < 64; i++) {
          if (workingBoard[i].candy?.color === targetColor) {
            listToClear.push(i);
          }
        }

        setGameStats((p) => ({ ...p, movesLeft: p.movesLeft - 1 }));
        playMatchSound(1);
        resolveBoardMatches(workingBoard, [{ indices: listToClear, color: targetColor, type: 'row' }], 1);
        return;
      }
    }

    const matches = checkForMatches(workingBoard);

    if (matches.length > 0 && selectedLevel) {
      // Valid Match! Deduct 1 move (only in move-mode)
      setGameStats((p) => ({
        ...p,
        movesLeft: selectedLevel.mode === 'moves' ? p.movesLeft - 1 : p.movesLeft,
      }));

      // Countdown bomb candies ticking
      let bombExploded = false;
      workingBoard.forEach((cell) => {
        if (cell.candy && cell.candy.bombTimer !== undefined) {
          cell.candy.bombTimer -= 1;
          if (cell.candy.bombTimer <= 0) bombExploded = true;
        }
      });

      if (bombExploded) {
        triggerAlert("Countdown Bomb Exploded!");
        playGameOverSound();
        setShowGameOver(true);
        setIsAnimating(false);
        return;
      }

      playMatchSound(1);
      resolveBoardMatches(workingBoard, matches, 1);
    } else {
      // Revert swap
      workingBoard[indexA].candy = candyA;
      workingBoard[indexB].candy = candyB;
      workingBoard[indexA].isIngredient = ingA;
      workingBoard[indexB].isIngredient = ingB;
      setBoard(workingBoard);
      playSwapSound();
      setIsAnimating(false);
    }
  };

  const handleCellSelect = (index: number) => {
    if (isAnimating) return;
    if (selectedBooster) {
      handleApplyBoosterOnCell(index);
    } else {
      setSelectedIndex(index);
      playClickSound();
    }
  };

  // Booster deployment triggers
  const handleApplyBoosterOnCell = async (index: number) => {
    if (!selectedBooster || !selectedLevel) return;

    setIsAnimating(true);
    let workingBoard = board.map(c => ({ ...c }));

    // Decrement Booster counts
    const bid = selectedBooster;
    const updatedBoosters = progress.boosters;
    updatedBoosters[bid] = Math.max(0, (updatedBoosters[bid] || 0) - 1);
    handleUpdateProgress({ ...progress, boosters: updatedBoosters });

    playBoosterSound();

    if (selectedBooster === 'hammer') {
      // Hammer destroys tile
      const targetC = workingBoard[index].candy;
      if (targetC) {
        spawnParticles(index, targetC.color);
      } else {
        spawnParticles(index, 'stone');
      }

      workingBoard[index].candy = null;
      workingBoard[index].isIngredient = false;
      workingBoard[index].obstacle = 'none';

      setBoard(workingBoard);
      setSelectedBooster(null);

      await new Promise((resolve) => setTimeout(resolve, 200));
      cascadeRefillCycle(workingBoard, 1, false);

    } else if (selectedBooster === 'color-remover') {
      // Clear all items of chosen color
      const chosenColor = workingBoard[index].candy?.color;
      if (chosenColor) {
        triggerAlert(`Clearing all ${chosenColor.toUpperCase()} candies!`);
        const clearIndices: number[] = [];
        for (let i = 0; i < 64; i++) {
          if (workingBoard[i].candy?.color === chosenColor) {
            clearIndices.push(i);
          }
        }
        setSelectedBooster(null);
        resolveBoardMatches(workingBoard, [{ indices: clearIndices, color: chosenColor, type: 'row' }], 1.5);
      } else {
        setIsAnimating(false);
        setSelectedBooster(null);
      }

    } else if (selectedBooster === 'bomb-booster') {
      // Convert tile to immediate Wrapped Bomb candy
      workingBoard[index].candy = createRandomCandy(undefined, 'wrapped');
      setBoard(workingBoard);
      setSelectedBooster(null);
      setIsAnimating(false);

      const formedMatches = checkForMatches(workingBoard);
      if (formedMatches.length > 0) {
        resolveBoardMatches(workingBoard, formedMatches, 1);
      }
    } else if (selectedBooster === 'extra-moves') {
      // Add moves/time
      setGameStats((p) => ({
        ...p,
        movesLeft: p.movesLeft + 5,
        timeLeft: p.timeLeft + 15,
      }));
      setSelectedBooster(null);
      setIsAnimating(false);
      triggerAlert("+5 Extra Moves Awarded!");
    }
  };

  const handleShuffleBoosterFromPanel = () => {
    if (isAnimating) return;

    // Decrement shuffle
    const updatedBoosters = progress.boosters;
    updatedBoosters['shuffle'] = Math.max(0, (updatedBoosters['shuffle'] || 0) - 1);
    handleUpdateProgress({ ...progress, boosters: updatedBoosters });

    playBoosterSound();
    const shuffled = shuffleBoard(board);
    setBoard(shuffled);
    triggerAlert("Sweet Candies Shuffled!");
  };

  const handleSelectBoosterFromTray = (bType: BoosterType | null) => {
    if (bType === 'shuffle') {
      handleShuffleBoosterFromPanel();
    } else if (bType === 'extra-moves') {
      // Direct Booster Apply
      setGameStats((p) => ({
        ...p,
        movesLeft: p.movesLeft + 5,
        timeLeft: p.timeLeft + 15,
      }));
      const updatedBoosters = progress.boosters;
      updatedBoosters['extra-moves'] = Math.max(0, (updatedBoosters['extra-moves'] || 0) - 1);
      handleUpdateProgress({ ...progress, boosters: updatedBoosters });
      playBoosterSound();
      triggerAlert("+5 Moves Added!");
    } else {
      setSelectedBooster(bType);
    }
  };

  // Star points calculator
  const starsEarned = selectedLevel ? calculateStars(gameStats.score, selectedLevel.starRatings) : 0;

  // Dynamic check for level completion
  const reachedTargetScore = selectedLevel ? gameStats.score >= selectedLevel.targetScore : false;
  const objectivesCompleted = selectedLevel ? selectedLevel.objectives.every(obj => {
    if (obj.type === 'score') return gameStats.score >= obj.target;
    return obj.current >= obj.target;
  }) : false;
  const isLevel1 = selectedLevel?.levelNumber === 1;
  const isLevelCompleted = selectedLevel ? (isLevel1 ? reachedTargetScore : (reachedTargetScore && objectivesCompleted)) : false;

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-950 text-white flex flex-col items-center overflow-hidden select-none">
      
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center text-white select-none touch-none animate-fade-in"
          >
            <div className="flex flex-col items-center gap-8">
              {/* Typography on top */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                className="text-center"
              >
                <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  AXUMIT STUDIOS
                </h2>
                <div className="h-[2px] w-12 bg-gradient-to-r from-pink-500 to-indigo-500 mx-auto mt-2.5 rounded-full" />
              </motion.div>

              {/* Logo placeholder below it */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                className="relative flex items-center justify-center w-24 h-24"
              >
                {/* Inner pulsing glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 blur-xl opacity-40 animate-pulse" />
                
                {/* Circular dashed ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
                  className="absolute inset-[-8px] rounded-full border border-dashed border-indigo-500/20"
                />
                
                {/* Outer rotating ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
                />
                
                {/* Main logo circle */}
                <div className="w-16 h-16 bg-slate-900 border border-slate-700/80 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-purple-500/20 to-transparent" />
                  <Sparkles className="w-7 h-7 text-indigo-400" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
        <>
          {currentView === 'home' && (
        <HomeScreen
          progress={progress}
          onStartGame={() => { playClickSound(); setCurrentView('map'); }}
          onUpdateProgress={handleUpdateProgress}
          achievements={achievements}
          leaderboard={leaderboard}
          stats={{
            totalMatches: totalMatchesCountRef.current,
            totalStars: Object.values(progress.levelStars || {}).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number,
            highestScore: Math.max(...Object.values(progress.highScores || {}).map((v: any) => Number(v)), 0),
          }}
          regenCountdown={regenCountdown}
        />
      )}

      {currentView === 'map' && (
        <LevelMap
          progress={progress}
          onSelectLevel={handleLaunchLevel}
          onBackToMenu={() => { playClickSound(); setCurrentView('home'); }}
          regenCountdown={regenCountdown}
        />
      )}

      {currentView === 'game' && selectedLevel && (
        <div 
          className="w-full max-w-[480px] sm:max-w-[540px] md:max-w-[600px] h-full bg-gradient-to-b from-slate-950 via-purple-950 to-indigo-950 flex flex-col px-3 py-1.5 sm:py-2 relative overflow-hidden select-none"
          style={{ backgroundImage: `url(${selectedLevel.backgroundGradient})` }}
        >
          
          {/* Header section (MAP navigation and score/objectives board) */}
          <div className="flex flex-col gap-1 shrink-0">
            {/* Live Stats display with integrated controls */}
            <ScoreBoard
              level={selectedLevel}
              stats={gameStats}
              currentScore={gameStats.score}
              highScore={progress.highScores[selectedLevel.levelNumber] || 0}
              onPauseToggle={() => { playClickSound(); setIsPaused(true); }}
              onMapClick={() => { playClickSound(); if (!showLevelClear && !hasClearedCurrentSession) { deductLife(); } setCurrentView('map'); stopBgmLoop(); }}
              onHelpClick={() => { playClickSound(); setShowRules(true); }}
              onRefreshClick={() => handleLaunchLevel(selectedLevel.levelNumber)}
              lives={progress.lives}
            />
          </div>

          {/* Game board section - centered, automatically scaled, fits viewport heights */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden py-1 sm:py-1.5">
            <div className="relative h-full w-full max-h-[min(100%,560px)] max-w-[min(100%,560px)] aspect-square rounded-2xl shadow-xl flex items-center justify-center">
              <CandyBoard
                board={board}
                selectedIndex={selectedIndex}
                onSelect={handleCellSelect}
                onSwap={handleSwap}
                isAnimating={isAnimating}
                selectedBooster={selectedBooster}
                onApplyBooster={handleApplyBoosterOnCell}
                hintIndices={hintIndices}
              />

              {/* Sparkle effects canvas layer */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-30"
              />
            </div>
          </div>

          {/* Bottom controls / Boosters tray footer section */}
          <div className="shrink-0 flex flex-col gap-1.5 sm:gap-2">
            <Boosters
              boosters={[
                { id: 'hammer', name: 'Lollipop Hammer', description: 'Crush any candy tile instantly.', count: progress.boosters['hammer'] || 0, icon: 'hammer', coinCost: 100 },
                { id: 'shuffle', name: 'Sweet Shuffle', description: 'Scramble board positions.', count: progress.boosters['shuffle'] || 0, icon: 'shuffle', coinCost: 80 },
                { id: 'extra-moves', name: 'Extra Moves', description: 'Instantly get +5 moves / +15s.', count: progress.boosters['extra-moves'] || 0, icon: 'extra-moves', coinCost: 120 },
                { id: 'color-remover', name: 'Color Remover', description: 'Vaporize all candies of a selected color.', count: progress.boosters['color-remover'] || 0, icon: 'color-remover', coinCost: 150 },
                { id: 'bomb-booster', name: 'Bomb Booster', description: 'Deploy an immediate Wrapped Exploder.', count: progress.boosters['bomb-booster'] || 0, icon: 'bomb-booster', coinCost: 200 },
              ]}
              selectedBooster={selectedBooster}
              onSelectBooster={handleSelectBoosterFromTray}
              isAnimating={isAnimating}
            />

            {/* Persistent Bottom Next Level Button */}
            <div className="w-full">
              {isLevelCompleted ? (
                <button
                  id="persistent-next-level-btn-active"
                  onClick={handleNextLevel}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-sans font-black py-2 rounded-lg transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] text-[11px] animate-pulse flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>NEXT LEVEL</span>
                  <span className="text-xs font-bold">➔</span>
                </button>
              ) : (
                <button
                  id="persistent-next-level-btn-inactive"
                  disabled
                  className="w-full bg-slate-900/50 border border-slate-800/60 text-slate-500 font-sans font-semibold py-2 rounded-lg text-[10px] flex items-center justify-center cursor-not-allowed select-none"
                >
                  COMPLETE OBJECTIVES TO ADVANCE
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* QUICK PAUSE MODAL OVERLAY */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl text-white"
            >
              <h2 className="text-3xl font-sans font-black tracking-tight mb-2">GAME PAUSED</h2>
              <p className="text-xs text-slate-400 mb-6">Take a quick breath, then jump back into the sweet combos!</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { playClickSound(); setIsPaused(false); }}
                  className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 font-sans font-black py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
                >
                  RESUME GAME
                </button>
                <button
                  onClick={() => { 
                    playClickSound(); 
                    if (!showLevelClear && !hasClearedCurrentSession) { deductLife(); } 
                    const currentLives = progress.lives !== undefined ? progress.lives : 5;
                    if (currentLives <= 1 && !showLevelClear && !hasClearedCurrentSession) {
                      setIsPaused(false);
                      setCurrentView('map');
                    } else {
                      handleLaunchLevel(selectedLevel!.levelNumber); 
                    }
                  }}
                  className="w-full py-3 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl font-sans font-bold text-xs"
                >
                  RESTART LEVEL
                </button>
                <button
                  onClick={() => { playClickSound(); if (!showLevelClear && !hasClearedCurrentSession) { deductLife(); } setIsPaused(false); setCurrentView('map'); stopBgmLoop(); }}
                  className="w-full py-3 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl font-sans font-bold text-xs"
                >
                  QUIT TO WORLD MAP
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEVEL RULE BOOK POPUP */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <button
                onClick={() => { playClickSound(); setShowRules(false); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-sans font-black tracking-tight text-white">SWEET MATCH RULES</h3>
              </div>

              <div className="space-y-3 text-xs text-slate-300 max-h-[300px] overflow-y-auto pr-1">
                <p>
                  Match <strong>3 or more</strong> adjacent candies of matching colors to clear them from the board and cause gravity cascades!
                </p>

                <div className="bg-slate-950/40 p-2.5 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="font-bold text-yellow-400">SPECIAL COMBOS</span>
                  <p>⭐ <strong>Match 4:</strong> Creates a row/column clearing Striped Candy.</p>
                  <p>⭐ <strong>Match L/T Shapes:</strong> Spawns a 3x3 exploding Wrapped Candy.</p>
                  <p>⭐ <strong>Match 5 Lines:</strong> Awards a glorious Color Bomb special candy.</p>
                </div>

                <div className="bg-slate-950/40 p-2.5 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="font-bold text-cyan-400">OBSTACLES</span>
                  <p>❄️ <strong>Ice:</strong> Melting requires a match adjacent to the ice block cell.</p>
                  <p>⛓️ <strong>Locked Cages:</strong> Free candies inside locked boxes by matching them.</p>
                  <p>🍫 <strong>Chocolate:</strong> Fills cells and spreads if no chocolate is cleared this turn.</p>
                </div>
              </div>

              <button
                onClick={() => { playClickSound(); setShowRules(false); }}
                className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans font-black py-3 rounded-xl text-xs"
              >
                UNDERSTOOD
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GAME VICTORY SCREEN */}
      <AnimatePresence>
        {showLevelClear && selectedLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-slate-900 border border-purple-500/30 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center text-white flex flex-col items-center gap-5"
            >
              {/* Spinning crown trophy badge */}
              <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-amber-200/20 flex items-center justify-center animate-bounce">
                <Trophy className="w-8 h-8 text-slate-950" />
              </div>

              <div>
                <h2 className="text-3xl font-sans font-black tracking-tight text-yellow-400">
                  Level Complete
                </h2>
                <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-wider">
                  {selectedLevel.worldName}
                </p>
              </div>

              {/* Stars display */}
              <div className="flex gap-2.5 justify-center py-2">
                {[1, 2, 3].map((starIdx) => (
                  <StarIcon
                    key={starIdx}
                    lit={starsEarned >= starIdx}
                    delay={starIdx * 150}
                  />
                ))}
              </div>

              {/* High scores summary */}
              <div className="w-full bg-slate-950/60 p-4 border border-slate-800 rounded-2xl space-y-2 text-sm font-mono text-slate-400">
                <div className="flex justify-between items-center">
                  <span>FINAL SCORE</span>
                  <span className="font-bold text-white text-base">
                    {gameStats.score.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-900 pt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-yellow-500" /> REWARDED COINS
                  </span>
                  <span className="font-bold text-amber-300">
                    +100 Coins
                  </span>
                </div>
              </div>

              {LEVEL_PRESETS.some(lvl => lvl.levelNumber === selectedLevel.levelNumber + 1) ? (
                <button
                  onClick={handleNextLevel}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-sans font-black py-4 rounded-xl transition-all shadow-lg hover:scale-103 active:scale-95 text-sm"
                >
                  NEXT LEVEL
                </button>
              ) : (
                <div className="w-full bg-slate-950/60 p-4 border border-indigo-500/30 rounded-2xl text-center space-y-1.5">
                  <span className="text-sm font-sans font-black text-indigo-400 block tracking-tight">
                    🏆 ALL LEVELS COMPLETED!
                  </span>
                  <span className="text-xs text-slate-400 block font-sans">
                    Congratulations! You've completed all available levels. New sweet adventures are coming soon!
                  </span>
                </div>
              )}

              <button
                onClick={() => { playClickSound(); setCurrentView('home'); setShowLevelClear(false); stopBgmLoop(); }}
                className="w-full py-2.5 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-xl font-sans font-bold text-xs"
              >
                HOME
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GAME FAILURE SCREEN */}
      <AnimatePresence>
        {showGameOver && selectedLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-slate-900 border border-rose-500/30 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center text-white flex flex-col items-center gap-5"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.4)] border border-rose-400/20 flex items-center justify-center">
                <X className="w-8 h-8 text-white" />
              </div>

              <div>
                <h2 className="text-3xl font-sans font-black tracking-tight text-rose-500">
                  Out of Moves!
                </h2>
                <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-wider">
                  Level {selectedLevel.levelNumber} Failed
                </p>
              </div>

              <div className="w-full bg-slate-950/60 p-4 border border-slate-800 rounded-2xl space-y-1 text-sm font-mono text-slate-400">
                <div className="flex justify-between items-center">
                  <span>YOUR SCORE</span>
                  <span className="font-bold text-white">
                    {gameStats.score.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-rose-400/80">
                  <span>REQUIRED</span>
                  <span className="font-bold">
                    {selectedLevel.targetScore.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full">
                {progress.lives !== undefined && progress.lives > 0 ? (
                  <button
                    onClick={() => { playClickSound(); handleLaunchLevel(selectedLevel.levelNumber); }}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-sans font-black py-3.5 rounded-xl transition-all shadow-lg hover:scale-103 active:scale-95 text-sm"
                  >
                    RETRY LEVEL
                  </button>
                ) : (
                  <div className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl py-3 px-4 text-center">
                    <span className="text-xs font-sans font-bold text-rose-400 flex items-center justify-center gap-1.5">
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
                      NO LIVES REMAINING
                    </span>
                  </div>
                )}
                <button
                  onClick={() => { playClickSound(); setCurrentView('home'); setShowGameOver(false); stopBgmLoop(); }}
                  className="w-full py-2.5 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-xl font-sans font-bold text-xs"
                >
                  HOME
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        </>
      )}
    </div>
  );
}

// Glowing victory star item component
interface StarIconProps {
  lit: boolean;
  delay: number;
}
const StarIcon: React.FC<StarIconProps> = ({ lit, delay }) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -30 }}
      animate={lit ? { scale: 1, rotate: 0 } : { scale: 0.8, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, delay: delay / 1000 }}
    >
      <Trophy className={`w-10 h-10 ${lit ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_#eab308]' : 'text-slate-700'}`} />
    </motion.div>
  );
};
