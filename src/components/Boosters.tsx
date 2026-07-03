import React from 'react';
import { Booster, BoosterType } from '../types';
import { Hammer, Shuffle, PlusCircle, Sparkles, Flame, X } from 'lucide-react';
import { playClickSound } from '../audio';

interface BoostersProps {
  boosters: Booster[];
  selectedBooster: BoosterType | null;
  onSelectBooster: (booster: BoosterType | null) => void;
  isAnimating: boolean;
}

export const Boosters: React.FC<BoostersProps> = React.memo(({
  boosters,
  selectedBooster,
  onSelectBooster,
  isAnimating,
}) => {
  // Map booster icon name to Lucide components
  const getIcon = (id: BoosterType) => {
    switch (id) {
      case 'hammer':
        return <Hammer className="w-4 h-4 text-pink-400" />;
      case 'shuffle':
        return <Shuffle className="w-4 h-4 text-teal-400" />;
      case 'extra-moves':
        return <PlusCircle className="w-4 h-4 text-indigo-400" />;
      case 'color-remover':
        return <Sparkles className="w-4 h-4 text-yellow-400" />;
      case 'bomb-booster':
        return <Flame className="w-4 h-4 text-purple-400" />;
      default:
        return <Hammer className="w-4 h-4 text-pink-400" />;
    }
  };

  const handleBoosterClick = (boosterId: BoosterType, count: number) => {
    if (isAnimating) return;
    if (count <= 0) return;

    playClickSound();

    if (selectedBooster === boosterId) {
      // Toggle off if clicked again
      onSelectBooster(null);
    } else {
      onSelectBooster(boosterId);
    }
  };

  return (
    <div 
      id="boosters-tray"
      className="w-full max-w-[480px] sm:max-w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 sm:p-2 shadow-xl flex flex-col gap-1 text-white"
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-0.5">
        <h3 className="font-sans font-black text-[8px] sm:text-[9px] tracking-wider text-slate-400 uppercase">
          BOOSTERS
        </h3>
        {selectedBooster && (
          <button
            onClick={() => { playClickSound(); onSelectBooster(null); }}
            className="flex items-center gap-1 text-[8px] font-bold text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 hover:bg-rose-500/20 px-1.5 py-0.5 rounded-md"
          >
            <X className="w-2.5 h-2.5" />
            Cancel
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1">
        {boosters.map((booster) => {
          const isSelected = selectedBooster === booster.id;
          const isDisabled = booster.count <= 0 || isAnimating;

          return (
            <button
              key={booster.id}
              disabled={isDisabled}
              onClick={() => handleBoosterClick(booster.id, booster.count)}
              className={`relative flex flex-col items-center gap-0.5 p-0.5 py-1 rounded-lg transition-all duration-300 border select-none ${
                isSelected
                  ? 'bg-purple-900/40 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)] scale-102 ring-1 ring-white/10'
                  : isDisabled
                  ? 'bg-slate-950/20 border-slate-900 opacity-40 cursor-not-allowed'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 active:scale-95'
              }`}
            >
              {/* Count bubble */}
              <span className="absolute top-0.5 right-0.5 flex items-center justify-center bg-purple-600 text-[8px] font-bold font-mono h-3 min-w-3 px-0.5 rounded-full border border-purple-400 shadow-md">
                {booster.count}
              </span>

              {/* Icon */}
              <div className={`p-1 rounded-md ${isSelected ? 'bg-purple-500/20' : 'bg-slate-900/50'}`}>
                {getIcon(booster.id)}
              </div>

              {/* Label */}
              <span className="text-[8px] font-bold tracking-tight text-center text-slate-300 max-w-[65px] line-clamp-1 leading-none mt-0.5">
                {booster.name.replace('Booster', '')}
              </span>
            </button>
          );
        })}
      </div>

      {selectedBooster && (
        <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-1 text-[8px] sm:text-[9px] font-semibold text-center text-purple-300 animate-pulse">
          🎯 SELECT A CANDY OR TILE TO APPLY THE {boosters.find((b) => b.id === selectedBooster)?.name.toUpperCase()}!
        </div>
      )}
    </div>
  );
});
