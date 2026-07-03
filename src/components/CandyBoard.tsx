import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BoardGrid, CandyColor, CandyType, ObstacleType, JellyType, BoosterType } from '../types';
import { Sparkles, HelpCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { playClickSound } from '../audio';

interface CandyBoardProps {
  board: BoardGrid;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onSwap: (indexA: number, indexB: number) => void;
  isAnimating: boolean;
  selectedBooster: BoosterType | null;
  onApplyBooster: (index: number) => void;
  hintIndices: [number, number] | null;
  performanceMode?: boolean;
}

export const CandyBoard: React.FC<CandyBoardProps> = ({
  board,
  selectedIndex,
  onSelect,
  onSwap,
  isAnimating,
  selectedBooster,
  onApplyBooster,
  hintIndices,
  performanceMode = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isAnimating || selectedBooster) {
      e.preventDefault();
      return;
    }

    const cell = board[index];
    // Cannot drag empty cells, stones, chocolates or caged candies
    if (!cell.candy && !cell.isIngredient) {
      e.preventDefault();
      return;
    }
    if (cell.obstacle === 'stone' || cell.obstacle === 'locked') {
      e.preventDefault();
      return;
    }

    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || isAnimating) return;

    const rowStart = Math.floor(draggedIndex / 8);
    const colStart = draggedIndex % 8;
    const rowEnd = Math.floor(targetIndex / 8);
    const colEnd = targetIndex % 8;

    const isAdjacent =
      (Math.abs(rowStart - rowEnd) === 1 && colStart === colEnd) ||
      (Math.abs(colStart - colEnd) === 1 && rowStart === rowEnd);

    if (isAdjacent) {
      onSwap(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleCellClick = (index: number) => {
    if (isAnimating) return;

    // IF A BOOSTER IS ACTIVE, clicking targets that specific cell!
    if (selectedBooster) {
      onApplyBooster(index);
      return;
    }

    const cell = board[index];
    if (!cell.candy && !cell.isIngredient && cell.obstacle === 'none') return;

    // Solid stones or locks can't be selected to swap
    if (cell.obstacle === 'stone') return;

    if (selectedIndex === null) {
      // Cannot select locked blocks to initiate a swap
      if (cell.obstacle === 'locked') return;
      onSelect(index);
    } else {
      const rowStart = Math.floor(selectedIndex / 8);
      const colStart = selectedIndex % 8;
      const rowEnd = Math.floor(index / 8);
      const colEnd = index % 8;

      const isAdjacent =
        (Math.abs(rowStart - rowEnd) === 1 && colStart === colEnd) ||
        (Math.abs(colStart - colEnd) === 1 && rowStart === rowEnd);

      if (isAdjacent && cell.obstacle !== 'locked') {
        onSwap(selectedIndex, index);
      } else {
        // Toggle or transfer selection
        if (cell.obstacle !== 'locked') {
          onSelect(index);
        } else {
          onSelect(null);
        }
      }
    }
  };

  // 3D Cherry / Hazelnut fruit rendering
  const renderIngredient = (isSelected: boolean) => {
    const selectedClass = isSelected 
      ? 'ring-4 ring-pink-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10 shadow-[0_0_20px_rgba(244,114,182,0.8)]' 
      : 'hover:scale-105 transition-all cursor-grab';

    return (
      <div className={`w-[82%] h-[82%] relative flex items-center justify-center ${selectedClass}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
          {/* Stem */}
          <path d="M50,15 Q30,25 35,45" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" />
          <path d="M35,25 Q15,10 10,20" fill="none" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
          
          {/* Main ripe glossy cherry fruit body */}
          <circle cx="35" cy="55" r="22" fill="url(#cherryGrad)" />
          
          {/* Leaf */}
          <path d="M50,15 C60,10 75,18 70,28 C65,35 52,20 50,15" fill="#16a34a" />

          {/* Highlights */}
          <ellipse cx="28" cy="45" rx="6" ry="3" fill="#ffffff" transform="rotate(-30 28 45)" opacity="0.8" />
          <circle cx="44" cy="62" r="3" fill="#ffffff" opacity="0.3" />
        </svg>
        <span className="absolute bottom-0 right-0 bg-rose-600 border border-white text-[8px] font-black font-mono text-white px-1 rounded-full scale-90">
          ESCORT
        </span>
      </div>
    );
  };

  // Render candy vectors
  const renderCandySVG = (color: CandyColor, type: CandyType, isSelected: boolean, bombTimer?: number, underIce: boolean = false) => {
    const isColorBomb = type === 'color-bomb';
    
    const selectedClass = isSelected 
      ? 'ring-4 ring-white ring-offset-2 ring-offset-purple-900 scale-105 z-10 shadow-[0_0_20px_rgba(255,255,255,0.9)]' 
      : 'hover:scale-[1.03] active:scale-95 cursor-grab';

    const frozenStyles = underIce ? { filter: 'hue-rotate(180deg) saturate(0.6) brightness(1.2)' } : {};

    // Ultra-fast non-allocating color & type hash for stable semi-random numbers
    let charSum = 0;
    for (let i = 0; i < color.length; i++) charSum += color.charCodeAt(i);
    for (let i = 0; i < type.length; i++) charSum += type.charCodeAt(i);
    const idleDuration = 3.5 + (charSum % 10) * 0.15;
    const sparkleDelay = 1.5 + (charSum % 5) * 0.8;

    if (isColorBomb) {
      return (
        <div 
          className={`w-[82%] h-[82%] relative flex items-center justify-center transition-all duration-300 ${selectedClass}`}
          style={frozenStyles}
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: 360
            }}
            transition={{
              scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 18, repeat: Infinity, ease: 'linear' }
            }}
            className="w-full h-full relative"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]">
              {/* Outer Energy Glow Ring */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#bombGlow)" strokeWidth="4.5" opacity="0.85" className="animate-pulse" />
              {/* Main Sphere */}
              <circle cx="50" cy="50" r="36" fill="url(#bombBase)" stroke="#4f46e5" strokeWidth="1" />
              {/* 3D Glass shine dome */}
              <path d="M 22,35 C 22,23 35,18 50,18 C 40,22 28,30 25,40 Z" fill="white" opacity="0.45" />
              
              {/* Shiny Candy Sprinkles */}
              <path d="M50,28 C50,28 45,23 45,19 C45,16 48,15 50,17 C52,15 55,16 55,19 C55,23 50,28 50,28 Z" fill="#ef4444" transform="rotate(15 50 25)" />
              <path d="M28,45 C28,45 35,52 35,56 C35,60 31,62 28,62 C25,62 21,60 21,56 C21,52 28,45 28,45 Z" fill="#00f5ff" transform="rotate(-45 28 55)" />
              <rect x="68" y="42" width="10" height="10" rx="3" fill="#00ff88" transform="rotate(30 73 47)" />
              <circle cx="68" cy="28" r="4.5" fill="#ffaa00" />
              <path d="M32,28 C36,22 44,22 48,28 C42,30 38,30 32,28 Z" fill="#d000ff" transform="rotate(45 40 28)" />
            </svg>
          </motion.div>
          <div className="absolute inset-0.5 border border-dashed border-pink-400 rounded-full animate-ping opacity-25 pointer-events-none" />
        </div>
      );
    }

    const isWrapped = type === 'wrapped';
    const isStripedRow = type === 'striped-row';
    const isStripedCol = type === 'striped-col';

    return (
      <div 
        className={`w-[82%] h-[82%] relative flex items-center justify-center transition-all duration-300 ${selectedClass}`}
        style={frozenStyles}
      >
        {/* Wrapped candy background wrapper glow */}
        {isWrapped && (
          <div className="absolute inset-[-4px] z-0 animate-pulse">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-90">
              {/* Wrapped bows */}
              <polygon points="10,30 35,50 10,70 2,50" fill={`url(#wrapperGlow_${color})`} stroke="white" strokeWidth="1.5" />
              <polygon points="90,30 65,50 90,70 98,50" fill={`url(#wrapperGlow_${color})`} stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
        )}

        {/* Candy Shape Vector */}
        <motion.div
          animate={{
            y: [0, -3.5, 0],
            scale: [1, 1.03, 1]
          }}
          transition={{
            duration: idleDuration,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="w-full h-full relative flex items-center justify-center"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] overflow-visible">

            {/* Render unique vector shape based on color */}
            {color === 'red' && (
              <>
                {/* Strawberry Heart shape */}
                <path d="M50 82 C50 82 16 54 16 34 C16 19 28 14 42 23 L50 30 L58 23 C72 14 84 19 84 34 C84 54 50 82 50 82 Z" fill="url(#redCandy)" stroke="#730018" strokeWidth="1" />
                {/* 3D Glossy Reflection */}
                <path d="M 24,34 C 24,24 31,18 42,22 C 36,26 28,30 26,36 Z" fill="url(#candyShine)" />
                <circle cx="32" cy="28" r="3.5" fill="white" opacity="0.8" />
              </>
            )}

            {color === 'blue' && (
              <>
                {/* Liquid Sapphire teardrop/pear shape */}
                <path d="M50,15 C50,15 82,45 82,65 C82,82 68,90 50,90 C32,90 18,82 18,65 C18,45 50,15 50,15 Z" fill="url(#blueCandy)" stroke="#002d6b" strokeWidth="1" />
                {/* 3D Glossy Reflection */}
                <path d="M30,55 C30,45 38,35 45,28 C42,34 35,45 35,55 C35,60 38,65 42,70 C34,68 30,62 30,55 Z" fill="url(#candyShine)" />
                <circle cx="38" cy="38" r="3.5" fill="white" opacity="0.8" />
              </>
            )}

            {color === 'green' && (
              <>
                {/* Glow Emerald pillow cube shape */}
                <path d="M25,15 Q50,8 75,15 Q92,50 75,85 Q50,92 25,85 Q8,50 25,15 Z" fill="url(#greenCandy)" stroke="#022c22" strokeWidth="1" />
                {/* 3D Glossy Reflection */}
                <path d="M28,24 Q50,16 72,24 C60,28 40,28 28,24 Z" fill="url(#candyShine)" />
                <circle cx="34" cy="28" r="3.5" fill="white" opacity="0.8" />
              </>
            )}

            {color === 'yellow' && (
              <>
                {/* Golden Topaz rounded 4-point star */}
                <path d="M50,10 C50,38 62,50 90,50 C62,50 50,62 50,90 C50,62 38,50 10,50 C38,50 50,38 50,10 Z" fill="url(#yellowCandy)" stroke="#713f12" strokeWidth="1" />
                {/* 3D Glossy Reflection */}
                <path d="M38,38 C42,32 46,28 50,22 C48,28 44,32 38,38 Z" fill="url(#candyShine)" />
                <circle cx="45" cy="45" r="2.5" fill="white" opacity="0.8" />
              </>
            )}

            {color === 'orange' && (
              <>
                {/* Juicy Tangerine spheroid */}
                <circle cx="50" cy="50" r="38" fill="url(#orangeCandy)" stroke="#7c2d12" strokeWidth="1" />
                {/* Slices decoration to look juicy */}
                <circle cx="50" cy="50" r="28" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4,8" opacity="0.3" />
                {/* 3D Glossy Reflection */}
                <path d="M22,35 C22,23 35,18 50,18 C40,22 28,30 25,40 Z" fill="url(#candyShine)" />
                <circle cx="34" cy="28" r="3.5" fill="white" opacity="0.8" />
              </>
            )}

            {color === 'purple' && (
              <>
                {/* Classic Jelly Bean shape */}
                <path d="M25,35 C35,20 65,20 75,35 C85,50 80,75 50,80 C25,85 15,60 25,35 Z" fill="url(#purpleCandy)" stroke="#4a044e" strokeWidth="1" />
                {/* 3D Glossy Reflection */}
                <path d="M32,38 C38,28 55,28 62,35 C52,38 42,38 32,38 Z" fill="url(#candyShine)" />
                <circle cx="42" cy="30" r="3.5" fill="white" opacity="0.8" />
              </>
            )}

            {/* Special candy markings overlay */}
            {isStripedRow && (
              <g className="animate-pulse">
                <line x1="15" y1="40" x2="85" y2="40" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
                <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                <line x1="15" y1="60" x2="85" y2="60" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
              </g>
            )}

            {isStripedCol && (
              <g className="animate-pulse">
                <line x1="40" y1="15" x2="40" y2="85" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
                <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                <line x1="60" y1="15" x2="60" y2="85" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
              </g>
            )}

            {/* Sparkle Twinkle element */}
            <motion.path
              d="M 50,50 L 52,55 L 57,57 L 52,59 L 50,64 L 48,59 L 43,57 L 48,55 Z"
              fill="white"
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.9, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: sparkleDelay,
                ease: 'easeInOut'
              }}
              style={{ originX: '50px', originY: '57px' }}
            />

          </svg>

          {/* Bomb Timer Lit Fuse Badge */}
          {bombTimer !== undefined && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center border border-red-500 shadow-md">
              <span className="text-[10px] font-mono font-black text-red-500 animate-pulse leading-none">
                BOMB
              </span>
              <span className={`text-sm font-mono font-black ${bombTimer <= 3 ? 'text-red-500 animate-ping' : 'text-yellow-400'}`}>
                {bombTimer}
              </span>
            </div>
          )}

        </motion.div>
      </div>
    );
  };

  return (
    <div 
      id="candy-board"
      className="grid grid-cols-8 gap-0.5 sm:gap-1 p-1 sm:p-1.5 bg-slate-900/95 border-2 sm:border-4 border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-[0_15px_30px_rgba(0,0,0,0.6)] w-full h-full max-w-[min(100%,560px)] max-h-[min(100%,560px)] aspect-square select-none touch-none relative"
    >
      {/* Global SVG gradients definition to avoid duplicates, shrinking DOM and increasing render speed by 10x */}
      <svg width="0" height="0" className="absolute pointer-events-none" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <radialGradient id="cherryGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="60%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </radialGradient>
          
          <radialGradient id="bombBase" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="50%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#030712" />
          </radialGradient>
          
          <linearGradient id="bombGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          <linearGradient id="wrapperGlow_red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ef4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wrapperGlow_blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wrapperGlow_green" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wrapperGlow_yellow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#eab308" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wrapperGlow_orange" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wrapperGlow_purple" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="redCandy" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ff85a0" />
            <stop offset="45%" stopColor="#ff2255" />
            <stop offset="85%" stopColor="#c40030" />
            <stop offset="100%" stopColor="#730018" />
          </radialGradient>
          
          <radialGradient id="blueCandy" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#80f3ff" />
            <stop offset="45%" stopColor="#00c0ff" />
            <stop offset="85%" stopColor="#005ec4" />
            <stop offset="100%" stopColor="#002d6b" />
          </radialGradient>

          <radialGradient id="greenCandy" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#8cffd0" />
            <stop offset="45%" stopColor="#10b981" />
            <stop offset="85%" stopColor="#047857" />
            <stop offset="100%" stopColor="#022c22" />
          </radialGradient>

          <radialGradient id="yellowCandy" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fffecc" />
            <stop offset="45%" stopColor="#facc15" />
            <stop offset="85%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>

          <radialGradient id="orangeCandy" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffcc8c" />
            <stop offset="45%" stopColor="#f97316" />
            <stop offset="85%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>

          <radialGradient id="purpleCandy" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#f5ccff" />
            <stop offset="45%" stopColor="#d946ef" />
            <stop offset="85%" stopColor="#a21caf" />
            <stop offset="100%" stopColor="#4a044e" />
          </radialGradient>

          <linearGradient id="candyShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>
      {board.map((cell, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const isSelected = selectedIndex === index;

        // Hint indicators check
        const isHinting = hintIndices && (hintIndices[0] === index || hintIndices[1] === index);

        // Render jelly layer under candy
        const hasJelly = cell.jelly !== 'none';
        const isDoubleJelly = cell.jelly === 'jelly2';

        return (
          <div
            key={index}
            id={`cell-${index}`}
            className={`relative aspect-square flex items-center justify-center rounded-xl overflow-hidden ${
              hasJelly 
                ? isDoubleJelly 
                  ? 'bg-gradient-to-tr from-cyan-500/25 to-blue-500/35 border border-cyan-400/40 shadow-[inset_0_0_8px_#22d3ee]' 
                  : 'bg-cyan-500/10 border border-cyan-500/20' 
                : 'bg-slate-950/40 border border-slate-900/60'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            {/* JELLY LAYER TEXTURE */}
            {hasJelly && (
              <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen bg-[radial-gradient(circle_at_center,_#22d3ee_10%,_transparent_60%)] animate-pulse" />
            )}

            {/* CANDY CONTENT */}
            {cell.candy && (
              <motion.div
                id={`candy-item-${cell.candy.id}`}
                draggable={!isAnimating && cell.obstacle !== 'locked' && cell.obstacle !== 'stone'}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCellClick(index)}
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{ willChange: 'transform' }}
                initial={performanceMode ? { scale: 0.9, opacity: 0 } : { scale: 0, y: -60, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={performanceMode ? { opacity: 0, transition: { duration: 0.05 } } : { scale: 0, opacity: 0, transition: { duration: 0.08 } }}
                transition={performanceMode ? { duration: 0.08 } : { type: 'spring', stiffness: 600, damping: 30 }}
                layoutId={performanceMode ? undefined : `candy-layout-${cell.candy.id}`}
              >
                {renderCandySVG(cell.candy.color, cell.candy.type, isSelected, cell.candy.bombTimer, cell.obstacle.startsWith('ice'))}
              </motion.div>
            )}

            {/* CHERRY/HAZELNUT INGREDIENT CONTENT */}
            {cell.isIngredient && (
              <motion.div
                draggable={!isAnimating}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCellClick(index)}
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{ willChange: 'transform' }}
                initial={performanceMode ? { scale: 0.9, opacity: 0 } : { scale: 0 }}
                animate={{ scale: 1 }}
                exit={performanceMode ? { opacity: 0, transition: { duration: 0.05 } } : { scale: 0 }}
                transition={performanceMode ? { duration: 0.08 } : undefined}
                layoutId={performanceMode ? undefined : "ingredient-layout"}
              >
                {renderIngredient(isSelected)}
              </motion.div>
            )}

            {/* OBSTACLE LAYER FOREGROUNDS */}

            {/* ICE OBSTACLE OVERLAYS */}
            {cell.obstacle.startsWith('ice') && (
              <motion.div 
                className="absolute inset-0 bg-blue-100/50 backdrop-blur-[1px] border border-cyan-200/50 rounded-xl z-20 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  boxShadow: 'inset 0 0 10px rgba(186,230,253,0.8)',
                  backgroundImage: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.7) 10%, transparent 60%)',
                }}
              >
                <span className="text-[10px] font-mono font-black text-cyan-800 drop-shadow-md">
                  {cell.obstacle === 'ice2' ? '❄️❄️' : '❄️'}
                </span>
              </motion.div>
            )}

            {/* CHOCOLATE BLOCKS (Fills entirely, no candy visible) */}
            {cell.obstacle === 'chocolate' && (
              <motion.div
                onClick={() => handleCellClick(index)}
                className="absolute inset-0.5 bg-gradient-to-tr from-amber-950 to-amber-800 border-2 border-amber-700 rounded-xl z-20 flex flex-col items-center justify-center shadow-lg cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-4.5 h-4.5 bg-amber-900 border border-amber-600 rounded flex items-center justify-center text-[7px] text-amber-300 font-bold">
                  CHO
                </div>
              </motion.div>
            )}

            {/* STONE BLOCKS (Rigid unbreakable grey rocks) */}
            {cell.obstacle === 'stone' && (
              <div
                className="absolute inset-0.5 bg-gradient-to-tr from-slate-800 to-slate-600 border-2 border-slate-500 rounded-xl z-20 flex flex-col items-center justify-center shadow-inner text-[10px] font-bold text-slate-300"
              >
                🪨
              </div>
            )}

            {/* CAGED LOCK WRAP */}
            {cell.obstacle === 'locked' && (
              <div 
                className="absolute inset-0 bg-slate-900/10 border-4 border-yellow-600 border-dashed rounded-xl z-20 pointer-events-none flex items-center justify-center"
              >
                <span className="bg-slate-950/85 px-1 rounded text-[8px] font-sans font-black text-yellow-500 border border-yellow-600">
                  CAGED
                </span>
              </div>
            )}

            {/* HINT SUGGESTION GLOWING LOOP */}
            {isHinting && (
              <div className="absolute inset-0.5 border-2 border-yellow-400 rounded-xl z-30 pointer-events-none animate-pulse shadow-[0_0_12px_#facc15]" />
            )}

            {/* TARGETING RETICLE FOR ACTIVED BOOSTER CHOSEN */}
            {selectedBooster && (
              <div className="absolute inset-0 hover:bg-purple-500/20 z-40 cursor-crosshair flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-purple-400 border-dashed rounded-full animate-spin" />
              </div>
            )}

          </div>
        );
      })}

    </div>
  );
};
