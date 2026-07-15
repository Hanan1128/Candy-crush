import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Target, Flame, Zap, Sparkles, Star, Pause, Clock, Check, Heart, HelpCircle, RefreshCw } from 'lucide-react';
import { GameStats, LevelConfig } from '../types';
import { playClickSound } from '../audio';

interface ScoreBoardProps {
  level: LevelConfig;
  stats: GameStats;
  currentScore: number;
  highScore: number;
  onPauseToggle: () => void;
  onMapClick: () => void;
  onHelpClick: () => void;
  onRefreshClick: () => void;
  lives?: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  level,
  stats,
  currentScore,
  highScore,
  onPauseToggle,
  onMapClick,
  onHelpClick,
  onRefreshClick,
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
      className="w-full max-w-[480px] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 sm:p-2 shadow-xl flex flex-col gap-1 text-white"
    >
      {/* Top row with World Name, Lives, combo, and Pause Button */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-1 gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => { playClickSound(); onMapClick(); }}
            className="text-[9px] font-mono font-bold bg-slate-950/80 hover:bg-slate-800 border border-slate-800 px-1.5 py-0.5 rounded-md transition-all shrink-0 text-slate-200"
          >
            ◀ MAP
          </button>
          
          <div className="flex flex-col min-w-0">
            <span className="text-[6px] sm:text-[7px] font-mono font-black text-pink-400 tracking-wider uppercase leading-none truncate">
              {level.worldName}
            </span>
            <h3 className="font-sans font-black text-[10px] sm:text-xs tracking-tight leading-none mt-0.5">
              L{level.levelNumber}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Compact Lives Badge */}
          <div className="flex items-center gap-0.5 bg-slate-950/60 px-1 py-0.5 rounded-full border border-slate-800 text-[8px] font-mono font-bold text-rose-300 leading-none">
            <Heart className="w-2 h-2 text-rose-500 fill-rose-500 shrink-0" />
            <span>{lives}</span>
          </div>

          {/* Combo Multiplier badge */}
          <AnimatePresence>
            {stats.comboMultiplier > 1 && (
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-red-600 px-1 py-0.5 rounded-full text-[8px] font-black tracking-wide border border-orange-400 leading-none"
              >
                <Flame className="w-2 h-2 fill-white shrink-0" />
                <span>{stats.comboMultiplier}x</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Action button */}
          <button
            onClick={() => { playClickSound(); onHelpClick(); }}
            className="p-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md transition-all"
          >
            <HelpCircle className="w-2.5 h-2.5 text-slate-300" />
          </button>

          {/* Refresh Action button */}
          <button
            onClick={() => { playClickSound(); onRefreshClick(); }}
            className="p-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md transition-all"
          >
            <RefreshCw className="w-2.5 h-2.5 text-slate-300" />
          </button>

          {/* Pause Action button */}
          <button
            onClick={() => { playClickSound(); onPauseToggle(); }}
            className="p-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md transition-all"
          >
            <Pause className="w-2.5 h-2.5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Primary indicators (Moves left / timer AND Score counts) */}
      <div className="grid grid-cols-2 gap-1">
        
        {/* Main Limit: Timer or Moves left */}
        <div className="bg-slate-950/50 border border-slate-800/80 px-2 py-0.5 rounded-lg flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none">
              {level.mode === 'timed' ? 'TIME LEFT' : 'MOVES LEFT'}
            </span>
            <span className="font-mono text-sm font-black text-yellow-400 mt-0.5 leading-none">
              {level.mode === 'timed' ? stats.timeLeft : stats.movesLeft}
            </span>
          </div>

          <div className="p-0.5 bg-slate-900 rounded text-yellow-400 shrink-0">
            {level.mode === 'timed' ? (
              <Clock className={`w-3.5 h-3.5 ${stats.timeLeft <= 15 ? 'text-red-500 animate-ping' : ''}`} />
            ) : (
              <Zap className={`w-3.5 h-3.5 ${stats.movesLeft <= 5 ? 'text-orange-500 animate-bounce' : ''}`} />
            )}
          </div>
        </div>

        {/* Current Score Counter */}
        <div className="bg-slate-950/50 border border-slate-800/80 px-2 py-0.5 rounded-lg flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none">
              SCORE
            </span>
            <motion.span 
              key={currentScore}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.15 }}
              className="font-mono text-sm font-black text-pink-400 mt-0.5 leading-none"
            >
              {currentScore.toLocaleString()}
            </motion.span>
          </div>

          <div className="p-0.5 bg-slate-900 rounded text-pink-500 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* Progress Bar with Floating Star Milestones */}
      <div className="flex flex-col gap-0.5 bg-slate-950/30 border border-slate-800/50 p-1.5 rounded-lg">
        <div className="flex justify-between text-[7px] text-slate-400 font-bold px-0.5 leading-none">
          <span>STARS: {starsAchieved} / 3</span>
          <span className="font-mono text-pink-400">{progressPercent}%</span>
        </div>

        {/* The visual track bar */}
        <div className="h-1.5 bg-slate-950 rounded-full border border-slate-800/80 relative overflow-visible p-[1px] shadow-inner mt-0.5">
          
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
                  <Star className="w-1.5 h-1.5 fill-current" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Objectives list container - side-by-side flex layout */}
      <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-800/60 p-1 rounded-lg overflow-x-auto whitespace-nowrap scrollbar-none">
        <span className="text-[7px] font-mono font-black text-slate-400 tracking-wider uppercase shrink-0">
          GOALS:
        </span>

        <div className="flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          {level.objectives.map((obj, idx) => {
            const currentVal = obj.type === 'score' ? currentScore : obj.current;
            const complete = currentVal >= obj.target;

            // Generate precise and concise labels
            let label = '';
            if (obj.type === 'score') {
              label = `Score: ${currentVal}/${obj.target}`;
            } else if (obj.type === 'jelly') {
              label = complete ? "Jelly Cleared!" : `Jelly: ${Math.max(0, obj.target - currentVal)} left`;
            } else if (obj.type === 'ice') {
              label = complete ? "Ice Broken!" : `Ice: ${Math.max(0, obj.target - currentVal)} left`;
            } else if (obj.type === 'ingredient') {
              label = complete ? "Cherry Collected!" : `Cherry: ${currentVal}/${obj.target}`;
            } else if (obj.type === 'color') {
              label = complete ? `${obj.colorNeeded} Collected!` : `Collect ${obj.colorNeeded}: ${currentVal}/${obj.target}`;
            } else if (obj.type === 'chocolate') {
              label = complete ? "Choc Cleared!" : `Choc: ${Math.max(0, obj.target - currentVal)} left`;
            } else if (obj.type === 'locked') {
              label = complete ? "Cages Cleared!" : `Cages: ${Math.max(0, obj.target - currentVal)} left`;
            }

            return (
              <div 
                key={idx}
                className={`px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[9px] border shrink-0 ${
                  complete 
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 font-bold' 
                    : 'bg-slate-900/50 border-slate-800/60 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1 select-none shrink-0">
                  {obj.type === 'score' && <span className="text-[9px] shrink-0">🎯</span>}
                  {obj.type === 'jelly' && <span className="text-[9px] shrink-0">🧼</span>}
                  {obj.type === 'ice' && <span className="text-[9px] shrink-0">❄️</span>}
                  {obj.type === 'ingredient' && <span className="text-[9px] shrink-0">🍒</span>}
                  {obj.type === 'chocolate' && <span className="text-[9px] shrink-0">🍫</span>}
                  {obj.type === 'locked' && <span className="text-[9px] shrink-0">🔒</span>}
                  {obj.type === 'color' && (
                    <span 
                      className="w-2 h-2 rounded-full inline-block border border-white/20 shrink-0"
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

                  <span className="font-bold tracking-tight text-[9px] leading-none shrink-0">
                    {label}
                  </span>
                </div>

                {complete && (
                  <div className="bg-emerald-500 text-slate-950 p-0.5 rounded-full shrink-0">
                    <Check className="w-1.5 h-1.5 stroke-[4]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
