import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Target, Flame, Zap, Sparkles, Star, Pause, Clock, Check, Heart } from 'lucide-react';
import { GameStats, LevelConfig } from '../types';
import { playClickSound } from '../audio';

interface ScoreBoardProps {
  level: LevelConfig;
  stats: GameStats;
  currentScore: number;
  highScore: number;
  onPauseToggle: () => void;
  lives?: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  level,
  stats,
  currentScore,
  highScore,
  onPauseToggle,
  lives = 5,
}) => {
  // Determine points percentage based on level's maximum star rating
  const maxStarPoints = level.starRatings[2];
  const progressPercent = Math.min(100, Math.floor((currentScore / maxStarPoints) * 100));

  // Determine current star rating achieved
  let starsAchieved = 0;
  if (currentScore >= level.starRatings[2]) starsAchieved = 3;
  else if (currentScore >= level.starRatings[1]) starsAchieved = 2;
  else if (currentScore >= level.starRatings[0]) starsAchieved = 1;

  // Star milestone markers in percentages
  const starPercentages = [
    Math.floor((level.starRatings[0] / maxStarPoints) * 100),
    Math.floor((level.starRatings[1] / maxStarPoints) * 100),
    100,
  ];

  return (
    <div 
      id="score-board"
      className="w-full max-w-[480px] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 shadow-xl flex flex-col gap-1.5 text-white"
    >
      {/* Top row with World Name, Lives, combo, and Pause Button */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono font-black text-pink-400 tracking-widest uppercase leading-none">
            {level.worldName}
          </span>
          <h3 className="font-sans font-black text-xs sm:text-sm tracking-tight leading-none mt-1">
            LEVEL {level.levelNumber}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Compact Lives Badge */}
          <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800 text-[10px] font-mono font-bold text-rose-300">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>{lives}/5</span>
          </div>

          {/* Combo Multiplier badge */}
          <AnimatePresence>
            {stats.comboMultiplier > 1 && (
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-red-600 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide border border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
              >
                <Flame className="w-3 h-3 fill-white" />
                <span>{stats.comboMultiplier}x</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pause Action button */}
          <button
            onClick={() => { playClickSound(); onPauseToggle(); }}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all"
          >
            <Pause className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Primary indicators (Moves left / timer AND Score counts) */}
      <div className="grid grid-cols-2 gap-1.5">
        
        {/* Main Limit: Timer or Moves left */}
        <div className="bg-slate-950/50 border border-slate-800/80 px-2.5 py-1.5 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">
              {level.mode === 'timed' ? 'TIME LEFT' : 'MOVES LEFT'}
            </span>
            <span className="font-mono text-lg font-black text-yellow-400 mt-0.5 leading-none">
              {level.mode === 'timed' ? stats.timeLeft : stats.movesLeft}
            </span>
          </div>

          <div className="p-1 bg-slate-900 rounded-lg text-yellow-400">
            {level.mode === 'timed' ? (
              <Clock className={`w-4 h-4 ${stats.timeLeft <= 15 ? 'text-red-500 animate-ping' : ''}`} />
            ) : (
              <Zap className={`w-4 h-4 ${stats.movesLeft <= 5 ? 'text-orange-500 animate-bounce' : ''}`} />
            )}
          </div>
        </div>

        {/* Current Score Counter */}
        <div className="bg-slate-950/50 border border-slate-800/80 px-2.5 py-1.5 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">
              SCORE
            </span>
            <motion.span 
              key={currentScore}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 0.15 }}
              className="font-mono text-lg font-black text-pink-400 mt-0.5 leading-none"
            >
              {currentScore.toLocaleString()}
            </motion.span>
          </div>

          <div className="p-1 bg-slate-900 rounded-lg text-pink-500">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* Progress Bar with Floating Star Milestones */}
      <div className="flex flex-col gap-1 bg-slate-950/30 border border-slate-800/50 p-2 rounded-xl">
        <div className="flex justify-between text-[8px] text-slate-400 font-bold px-0.5">
          <span>STAR ACHIEVED: {starsAchieved} / 3</span>
          <span className="font-mono text-pink-400">{progressPercent}%</span>
        </div>

        {/* The visual track bar */}
        <div className="h-2.5 bg-slate-950 rounded-full border border-slate-800/80 relative overflow-visible p-[2px] shadow-inner mt-1">
          
          {/* Animated fill-gradient */}
          <motion.div 
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />

          {/* Star markers positioned accurately along the track */}
          {starPercentages.map((percent, starIdx) => {
            const lit = starsAchieved > starIdx;
            return (
              <div
                key={starIdx}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
                style={{ left: `${percent}%` }}
              >
                <div className={`p-0.5 rounded-full border transition-all ${lit ? 'bg-yellow-400 border-white text-slate-950 scale-105 shadow-md shadow-yellow-500/40' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                  <Star className="w-2.5 h-2.5 fill-current" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Objectives list container */}
      <div className="flex flex-col gap-1 bg-slate-950/40 border border-slate-800/60 p-2 rounded-xl">
        <span className="text-[8px] font-mono font-black text-slate-400 tracking-widest uppercase mb-1 block">
          TARGET OBJECTIVES
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {level.objectives.map((obj, idx) => {
            const currentVal = obj.type === 'score' ? currentScore : obj.current;
            const complete = currentVal >= obj.target;

            // Generate precise labels as requested
            let label = '';
            if (obj.type === 'score') {
              label = `Score target: ${obj.target}`;
            } else if (obj.type === 'jelly') {
              label = complete ? "All jelly cleared!" : `Clear all jelly (${Math.max(0, obj.target - currentVal)} remaining)`;
            } else if (obj.type === 'ice') {
              label = complete ? "All ice broken!" : `Break all ice (${Math.max(0, obj.target - currentVal)} remaining)`;
            } else if (obj.type === 'ingredient') {
              label = complete ? `${(obj.ingredientType || 'cherry').toUpperCase()}s collected!` : `Bring down ${obj.ingredientType || 'cherry'} (${currentVal}/${obj.target})`;
            } else if (obj.type === 'color') {
              label = complete ? `Collected ${obj.target} ${obj.colorNeeded}!` : `Collect ${obj.target} ${obj.colorNeeded} candies (${currentVal}/${obj.target})`;
            } else if (obj.type === 'chocolate') {
              label = complete ? "All chocolate destroyed!" : `Destroy all chocolate (${Math.max(0, obj.target - currentVal)} remaining)`;
            } else if (obj.type === 'locked') {
              label = complete ? "All cages cleared!" : `Clear all locked candies (${Math.max(0, obj.target - currentVal)} remaining)`;
            }

            return (
              <div 
                key={idx}
                className={`p-1.5 rounded-lg flex items-center justify-between text-[10px] border ${
                  complete 
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 font-bold' 
                    : 'bg-slate-900/50 border-slate-800/60 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 select-none min-w-0 flex-1">
                  {obj.type === 'score' && <span className="text-[10px] shrink-0">🎯</span>}
                  {obj.type === 'jelly' && <span className="text-[10px] shrink-0">🧼</span>}
                  {obj.type === 'ice' && <span className="text-[10px] shrink-0">❄️</span>}
                  {obj.type === 'ingredient' && <span className="text-[10px] shrink-0">🍒</span>}
                  {obj.type === 'chocolate' && <span className="text-[10px] shrink-0">🍫</span>}
                  {obj.type === 'locked' && <span className="text-[10px] shrink-0">🔒</span>}
                  {obj.type === 'color' && (
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block border border-white/20 shrink-0"
                      style={{
                        backgroundColor: 
                          obj.colorNeeded === 'red' ? '#ef4444' :
                          obj.colorNeeded === 'blue' ? '#3b82f6' :
                          obj.colorNeeded === 'green' ? '#10b981' :
                          obj.colorNeeded === 'yellow' ? '#f59e0b' :
                          obj.colorNeeded === 'orange' ? '#f97316' : '#a855f7'
                      }}
                    />
                  )}

                  <span className="font-bold tracking-tight text-[10px] leading-snug break-words">
                    {label}
                  </span>
                </div>

                <div className="flex items-center gap-1 font-mono font-black text-[10px] shrink-0 ml-1">
                  {complete ? (
                    <div className="bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                      <Check className="w-2 h-2 stroke-[4]" />
                    </div>
                  ) : (
                    obj.type === 'score' && (
                      <span>
                        {currentVal} / {obj.target}
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
