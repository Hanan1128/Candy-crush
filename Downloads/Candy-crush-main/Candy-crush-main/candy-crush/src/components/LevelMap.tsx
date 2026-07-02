import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, ChevronLeft, ChevronRight, Lock, Play, ArrowLeft, Coins, Heart } from 'lucide-react';
import { LevelConfig, UserProgress } from '../types';
import { LEVEL_PRESETS } from '../levels';
import { playClickSound } from '../audio';

interface LevelMapProps {
  progress: UserProgress;
  onSelectLevel: (levelNum: number) => void;
  onBackToMenu: () => void;
  regenCountdown?: string;
}

export const LevelMap: React.FC<LevelMapProps> = ({
  progress,
  onSelectLevel,
  onBackToMenu,
  regenCountdown,
}) => {
  const [selectedLevelBrief, setSelectedLevelBrief] = useState<LevelConfig | null>(null);
  const [activeWorld, setActiveWorld] = useState<number>(1);

  // Group levels by World
  const levelsByWorld = LEVEL_PRESETS.reduce((acc, level) => {
    if (!acc[level.worldNumber]) acc[level.worldNumber] = [];
    acc[level.worldNumber].push(level);
    return acc;
  }, {} as Record<number, LevelConfig[]>);

  const worlds = [
    { num: 1, name: 'Candy Kingdom', desc: 'A land made of sweet fluffy dreams', bg: 'from-pink-900/60 via-purple-950/40 to-slate-950' },
    { num: 2, name: 'Chocolate Valley', desc: 'Silky brown rivers and fudge peaks', bg: 'from-amber-900/60 via-orange-950/40 to-slate-950' },
    { num: 3, name: 'Ice Glaciers', desc: 'Cool frozen sugar peaks and minty winds', bg: 'from-cyan-900/60 via-indigo-950/40 to-slate-950' },
  ];

  const handleLevelClick = (level: LevelConfig) => {
    playClickSound();
    if (level.levelNumber > progress.levelsUnlocked) {
      // Locked level! Play low buzz or alert
      return;
    }
    setSelectedLevelBrief(level);
  };

  const handleStartLevel = () => {
    if (selectedLevelBrief) {
      playClickSound();
      onSelectLevel(selectedLevelBrief.levelNumber);
      setSelectedLevelBrief(null);
    }
  };

  const nextWorld = () => {
    playClickSound();
    if (activeWorld < 3) setActiveWorld(activeWorld + 1);
  };

  const prevWorld = () => {
    playClickSound();
    if (activeWorld > 1) setActiveWorld(activeWorld - 1);
  };

  return (
    <div className={`w-full max-w-[480px] h-full bg-gradient-to-b ${worlds[activeWorld - 1].bg} text-white flex flex-col p-4 relative overflow-y-auto overflow-x-hidden`}>
      
      {/* Decorative background clouds/bubbles */}
      <div className="absolute top-1/4 left-[-20%] w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-[-20%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top persistent map header */}
      <div className="flex justify-between items-center mb-4 z-10">
        <button
          onClick={() => { playClickSound(); onBackToMenu(); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white font-sans font-bold text-xs"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          MENU
        </button>

        {/* Level Map Stars, Coins and Lives */}
        <div className="flex gap-2">
          {/* Lives indicator */}
          <div className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 shadow-md">
            <Heart className={`w-3.5 h-3.5 text-rose-500 fill-rose-500/25 ${progress.lives !== 0 ? 'animate-pulse' : ''}`} />
            <span className="font-mono font-bold text-xs text-rose-300">
              {progress.lives !== undefined ? progress.lives : 5}
            </span>
            {progress.lives !== undefined && progress.lives < 5 && regenCountdown && (
              <span className="text-[9px] font-mono text-slate-400 border-l border-slate-800 pl-1.5 ml-0.5 animate-pulse">
                {regenCountdown}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400/25" />
            <span className="font-mono font-bold text-xs text-amber-300">{progress.coins}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400/25" />
            <span className="font-mono font-bold text-xs text-yellow-400">
              {Object.values(progress.levelStars || {}).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number}
            </span>
          </div>
        </div>
      </div>

      {/* World selection slider bar */}
      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 mb-6 z-10">
        <button
          disabled={activeWorld === 1}
          onClick={prevWorld}
          className="p-1.5 bg-slate-950/80 hover:bg-slate-800 disabled:opacity-20 rounded-lg border border-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-mono tracking-widest text-pink-400 font-bold uppercase">
            WORLD {activeWorld} OF 3
          </span>
          <h2 className="font-sans font-black text-base text-white">
            {worlds[activeWorld - 1].name}
          </h2>
          <p className="text-[10px] text-slate-400 italic">
            {worlds[activeWorld - 1].desc}
          </p>
        </div>

        <button
          disabled={activeWorld === 3}
          onClick={nextWorld}
          className="p-1.5 bg-slate-950/80 hover:bg-slate-800 disabled:opacity-20 rounded-lg border border-slate-800"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Path Winding Node Journey */}
      <div className="flex-1 flex flex-col items-center justify-center relative pb-12">
        
        {/* SVG Drawing the beautiful connected winding route line */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-40">
          <path
            d="M 220 50 Q 120 120, 220 200 T 220 350 T 220 500 T 220 650"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="4"
            strokeDasharray="6,6"
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Winding level circles list */}
        <div className="w-full flex flex-col gap-10 items-center relative z-10 py-4">
          {levelsByWorld[activeWorld]?.map((lvl, index) => {
            const isUnlocked = lvl.levelNumber <= progress.levelsUnlocked;
            const isCurrent = lvl.levelNumber === progress.levelsUnlocked;
            const stars = progress.levelStars[lvl.levelNumber] || 0;

            // Offset the node horizontal position based on index to create a winding candy path
            const windingOffsets = ['translate-x-[-45px]', 'translate-x-[20px]', 'translate-x-[-15px]', 'translate-x-[45px]', 'translate-x-[-30px]'];
            const horizontalOffset = windingOffsets[index % windingOffsets.length];

            return (
              <div 
                key={lvl.levelNumber}
                className={`flex flex-col items-center relative ${horizontalOffset}`}
              >
                {/* Level node circle */}
                <motion.button
                  whileHover={isUnlocked ? { scale: 1.1 } : {}}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLevelClick(lvl)}
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-lg relative ${
                    isUnlocked
                      ? isCurrent
                        ? 'bg-gradient-to-tr from-pink-500 to-yellow-400 border-white text-slate-950 font-bold scale-110 shadow-[0_0_20px_rgba(236,72,153,0.6)] animate-pulse'
                        : 'bg-indigo-600 border-indigo-400 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  {isUnlocked ? (
                    <span className="font-sans font-black text-sm">{lvl.levelNumber}</span>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-600" />
                  )}

                  {/* Tiny stars floating directly beneath node */}
                  {isUnlocked && (
                    <div className="absolute bottom-[-15px] flex gap-0.5 justify-center">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3 h-3 ${
                            starIdx <= stars
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-slate-600 fill-slate-950/20'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pulse Indicator on active node */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping opacity-35 pointer-events-none" />
                  )}
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRE-LEVEL BRIEFING MODAL POPUP */}
      <AnimatePresence>
        {selectedLevelBrief && (
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
              {/* Close briefing */}
              <button
                onClick={() => { playClickSound(); setSelectedLevelBrief(null); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>

              <div className="text-center mb-6">
                <span className="text-xs font-mono font-bold text-pink-400 tracking-widest uppercase">
                  READY FOR LEVEL {selectedLevelBrief.levelNumber}
                </span>
                <h3 className="text-2xl font-sans font-black tracking-tight text-white mt-1">
                  {selectedLevelBrief.worldName}
                </h3>
                <p className="text-xs text-slate-400 mt-1 italic">
                  Game Mode: {selectedLevelBrief.mode.toUpperCase()}
                </p>
              </div>

              {/* Targets and Objectives Box */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 mb-6">
                <h4 className="text-xs font-mono font-black text-slate-400 tracking-widest mb-3 text-center uppercase">
                  LEVEL OBJECTIVES
                </h4>

                <div className="flex flex-col gap-2.5">
                  {selectedLevelBrief.objectives.map((obj, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-900 last:border-b-0">
                      <span className="font-sans font-bold text-slate-200 uppercase flex items-center gap-2">
                        {obj.type === 'score' && '🎯 TARGET SCORE'}
                        {obj.type === 'jelly' && '🧼 DISSOLVE JELLIES'}
                        {obj.type === 'color' && `🍬 COLLECT ${obj.colorNeeded?.toUpperCase()}`}
                        {obj.type === 'ice' && '❄️ CRUSH ICE BLOCKS'}
                        {obj.type === 'ingredient' && `🍒 ESCORT CHERRIES`}
                      </span>
                      <span className="font-mono font-bold text-pink-400 text-base">
                        {obj.target.toLocaleString()}
                      </span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between text-sm py-1 pt-2">
                    <span className="font-sans text-slate-400 uppercase">
                      {selectedLevelBrief.mode === 'timed' ? '⏱️ TIME ALLOWED' : '🎯 MOVES ALLOWED'}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {selectedLevelBrief.mode === 'timed' 
                        ? `${selectedLevelBrief.limitValue} Seconds` 
                        : `${selectedLevelBrief.limitValue} Moves`
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {progress.lives === 0 ? (
                  <div className="w-full bg-slate-850 border border-slate-800 text-slate-500 font-sans font-bold py-3.5 rounded-xl flex flex-col items-center justify-center gap-1 text-xs">
                    <span className="text-red-400 font-black flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      NO LIVES LEFT
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Next life in: {regenCountdown || "calculating..."}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleStartLevel}
                    className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-sans font-black py-3.5 rounded-xl transition-all shadow-lg hover:scale-103 active:scale-95 flex items-center justify-center gap-2 text-sm"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    PLAY LEVEL
                  </button>
                )}
                <button
                  onClick={() => { playClickSound(); setSelectedLevelBrief(null); }}
                  className="w-full py-3 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl font-sans font-bold text-xs transition-all"
                >
                  CANCEL
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
