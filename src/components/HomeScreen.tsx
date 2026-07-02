import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Settings, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Music, 
  Coins, 
  Award, 
  ChevronRight, 
  Gift, 
  RefreshCw, 
  BarChart2, 
  Dribbble,
  Heart
} from 'lucide-react';
import { UserProgress, BoosterType, Achievement, LeaderboardEntry } from '../types';
import { 
  playClickSound, 
  playBoosterSound, 
  playWheelTickSound, 
  setMusicEnabled, 
  setSfxEnabled, 
  getAudioSettings 
} from '../audio';

interface HomeScreenProps {
  progress: UserProgress;
  onStartGame: () => void;
  onUpdateProgress: (newProgress: UserProgress) => void;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  stats: {
    totalMatches: number;
    totalStars: number;
    highestScore: number;
  };
  regenCountdown?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  progress,
  onStartGame,
  onUpdateProgress,
  achievements,
  leaderboard,
  stats,
  regenCountdown,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'stats' | 'achievements' | 'leaderboard' | 'shop'>('menu');
  const [musicOn, setMusicOn] = useState(getAudioSettings().musicEnabled);
  const [sfxOn, setSfxOn] = useState(getAudioSettings().sfxEnabled);
  
  // Lucky Wheel state
  const [showWheel, setShowWheel] = useState(false);
  const [wheelDegree, setWheelDegree] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinReward, setSpinReward] = useState<string | null>(null);

  // Shop state
  const [shopSuccess, setShopSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Sync settings on load
    const audioSet = getAudioSettings();
    setMusicOn(audioSet.musicEnabled);
    setSfxOn(audioSet.sfxEnabled);
  }, []);

  const toggleMusic = () => {
    const nextVal = !musicOn;
    setMusicOn(nextVal);
    setMusicEnabled(nextVal);
    playClickSound();
  };

  const toggleSfx = () => {
    const nextVal = !sfxOn;
    setSfxOn(nextVal);
    setSfxEnabled(nextVal);
    playClickSound();
  };

  // Daily reward Claim logic
  const claimDailyReward = () => {
    playBoosterSound();
    const now = new Date();
    const updated = {
      ...progress,
      coins: progress.coins + 150,
      lastDailyClaim: now.toISOString(),
    };
    onUpdateProgress(updated);
    alert('Claimed 150 gold coins Daily Login Reward! Come back tomorrow!');
  };

  const canClaimDaily = (): boolean => {
    if (!progress.lastDailyClaim) return true;
    const lastClaimDate = new Date(progress.lastDailyClaim).toDateString();
    const today = new Date().toDateString();
    return lastClaimDate !== today;
  };

  // Lucky Wheel Prizes
  const WHEEL_SECTOR_REWARDS = [
    { name: '+100 Coins', type: 'coins', amount: 100, color: 'bg-rose-500' },
    { name: 'Lollipop Hammer', type: 'booster', boosterId: 'hammer', amount: 1, color: 'bg-purple-600' },
    { name: '+200 Coins', type: 'coins', amount: 200, color: 'bg-amber-500' },
    { name: 'Sweet Shuffle', type: 'booster', boosterId: 'shuffle', amount: 1, color: 'bg-teal-500' },
    { name: '+50 Coins', type: 'coins', amount: 50, color: 'bg-blue-500' },
    { name: 'Color Remover', type: 'booster', boosterId: 'color-remover', amount: 1, color: 'bg-fuchsia-500' },
    { name: '+300 Coins', type: 'coins', amount: 300, color: 'bg-yellow-500' },
    { name: 'Bomb Booster', type: 'booster', boosterId: 'bomb-booster', amount: 1, color: 'bg-emerald-500' },
  ];

  // Spin Wheel Physics
  const handleSpinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setSpinReward(null);

    // Dynamic rotation angles
    const baseSpins = 5 + Math.floor(Math.random() * 5); // 5 to 10 full circles
    const chosenIndex = Math.floor(Math.random() * 8);
    const sectorAngle = 360 / 8;
    const targetAngle = baseSpins * 360 + (360 - (chosenIndex * sectorAngle));

    setWheelDegree(targetAngle);

    // Simulated ticking sound effects during rotating spin
    let tickCount = 0;
    const totalTicks = 35;
    const interval = setInterval(() => {
      if (tickCount < totalTicks) {
        playWheelTickSound();
        tickCount++;
      } else {
        clearInterval(interval);
      }
    }, 110);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = WHEEL_SECTOR_REWARDS[chosenIndex];
      setSpinReward(prize.name);
      playBoosterSound();

      // Allocate Prize
      const updated = { ...progress };
      if (prize.type === 'coins') {
        updated.coins += prize.amount;
      } else if (prize.type === 'booster' && prize.boosterId) {
        const bid = prize.boosterId as BoosterType;
        updated.boosters[bid] = (updated.boosters[bid] || 0) + prize.amount;
      }
      onUpdateProgress(updated);
    }, 4200);
  };

  // Booster Purchasing Shop Logic
  const buyBooster = (type: BoosterType, cost: number) => {
    playClickSound();
    if (progress.coins < cost) {
      alert('Insufficient gold coins in bank!');
      return;
    }

    const updated = {
      ...progress,
      coins: progress.coins - cost,
      boosters: {
        ...progress.boosters,
        [type]: (progress.boosters[type] || 0) + 1
      }
    };
    onUpdateProgress(updated);
    setShopSuccess(`Purchased 1x ${type.replace('-', ' ')}!`);
    setTimeout(() => setShopSuccess(null), 2500);
  };

  return (
    <div className="w-full max-w-[480px] h-full bg-gradient-to-b from-slate-950 via-purple-950 to-indigo-950 text-white flex flex-col p-4 overflow-y-auto">
      {/* Header with Settings and Coin Balance */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {/* Coins indicator */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 shadow-md">
            <Coins className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            <span className="font-mono font-bold text-amber-300 text-sm">
              {progress.coins}
            </span>
          </div>

          {/* Lives indicator */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 shadow-md">
            <Heart className={`w-5 h-5 text-rose-500 fill-rose-500/20 ${progress.lives !== 0 ? 'animate-pulse' : ''}`} />
            <span className="font-mono font-bold text-rose-300 text-sm">
              {progress.lives !== undefined ? progress.lives : 5}/5
            </span>
            {progress.lives !== undefined && progress.lives < 5 && regenCountdown && (
              <span className="text-xs font-mono text-slate-400 border-l border-slate-800 pl-2 ml-0.5 animate-pulse">
                {regenCountdown}
              </span>
            )}
          </div>
        </div>

        {/* Audio settings */}
        <div className="flex gap-2">
          <button 
            onClick={toggleMusic}
            className={`p-2 rounded-xl border transition-all ${musicOn ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
          >
            <Music className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={toggleSfx}
            className={`p-2 rounded-xl border transition-all ${sfxOn ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
          >
            {sfxOn ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* MAIN GAME MENU TABS */}
        {activeTab === 'menu' && (
          <motion.div 
            key="menu-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-between py-4"
          >
            {/* Sparkling game logo */}
            <div className="text-center my-4 relative flex flex-col items-center">
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="w-24 h-24 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-[35%] flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.5)] border-2 border-white/20"
              >
                <div className="w-12 h-12 bg-white rounded-full relative flex items-center justify-center animate-pulse">
                  <Sparkles className="w-7 h-7 text-pink-500" />
                </div>
              </motion.div>
              <h1 className="text-4xl font-sans font-black tracking-tight mt-6 bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                Candy Crush
              </h1>
              <span className="text-xs font-mono font-bold tracking-widest text-pink-400 uppercase">
                ADVANCED EDITION
              </span>
            </div>

            {/* Menu Buttons Tray */}
            <div className="w-full flex flex-col gap-3.5 px-2 my-6">
              <button
                id="play-journey-btn"
                onClick={() => { playClickSound(); onStartGame(); }}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-sans font-black text-lg tracking-wide transition-all shadow-[0_10px_25px_rgba(236,72,153,0.3)] hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2 animate-pulse"
              >
                START SWEET JOURNEY
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { playClickSound(); setActiveTab('stats'); }}
                  className="py-3 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl font-sans font-bold text-sm text-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <BarChart2 className="w-4 h-4 text-purple-400" />
                  STATISTICS
                </button>
                <button
                  onClick={() => { playClickSound(); setActiveTab('achievements'); }}
                  className="py-3 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl font-sans font-bold text-sm text-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  BADGES
                </button>
                <button
                  onClick={() => { playClickSound(); setActiveTab('leaderboard'); }}
                  className="py-3 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl font-sans font-bold text-sm text-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  LEADERBOARD
                </button>
                <button
                  onClick={() => { playClickSound(); setActiveTab('shop'); }}
                  className="py-3 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl font-sans font-bold text-sm text-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4 text-yellow-400" />
                  BOOSTER SHOP
                </button>
              </div>

              {/* Lucky Wheel and Daily Login Promos */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  onClick={() => { playClickSound(); setShowWheel(true); }}
                  className="py-3.5 bg-gradient-to-r from-teal-900/40 to-emerald-900/40 border-2 border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center text-center text-xs font-bold gap-1 transition-all hover:scale-103 active:scale-95"
                >
                  <Dribbble className="w-6 h-6 text-emerald-400 animate-spin" />
                  <span>LUCKY WHEEL</span>
                </button>

                <button
                  disabled={!canClaimDaily()}
                  onClick={claimDailyReward}
                  className={`py-3.5 rounded-2xl flex flex-col items-center justify-center text-center text-xs font-bold gap-1 transition-all border-2 ${
                    canClaimDaily()
                      ? 'bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border-yellow-500/30 hover:scale-103 active:scale-95 cursor-pointer'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Gift className={`w-6 h-6 ${canClaimDaily() ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
                  <span>{canClaimDaily() ? 'CLAIM DAILY' : 'CLAIMED'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'stats' && (
          <motion.div 
            key="stats-view"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-sans font-black tracking-tight">PLAYER STATISTICS</h2>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1.5">
                <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Levels Unlocked</span>
                <span className="text-3xl font-sans font-black text-white">{progress.levelsUnlocked}</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1.5">
                <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Highest Score Record</span>
                <span className="text-3xl font-mono font-black text-amber-300">{stats.highestScore.toLocaleString()} pts</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1.5">
                <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Total Candy Matches</span>
                <span className="text-3xl font-sans font-black text-pink-400">{stats.totalMatches} matches</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1.5">
                <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Total Stars Earned</span>
                <span className="text-3xl font-sans font-black text-yellow-400">{stats.totalStars} ⭐</span>
              </div>
            </div>

            <button
              onClick={() => { playClickSound(); setActiveTab('menu'); }}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-sans font-bold text-sm mt-6 transition-all"
            >
              BACK TO MAIN MENU
            </button>
          </motion.div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <motion.div 
            key="achieve-view"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-sans font-black tracking-tight">SWEET ACHIEVEMENTS</h2>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[450px] pr-1 flex flex-col gap-3">
              {achievements.map((item) => (
                <div 
                  key={item.id}
                  className={`border p-3.5 rounded-2xl flex items-center gap-3.5 transition-all ${
                    item.isUnlocked 
                      ? 'bg-emerald-950/20 border-emerald-500/30 shadow-md shadow-emerald-500/5' 
                      : 'bg-slate-900/30 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${item.isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-950/40 text-slate-600'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="font-sans font-bold text-sm truncate text-white">{item.title}</h4>
                      {item.isUnlocked && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                          UNLOCKED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">{item.description}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px] font-mono">
                      <span>Progress: {item.current} / {item.target}</span>
                      <span className="text-amber-400 font-bold">+{item.rewardCoins} coins</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { playClickSound(); setActiveTab('menu'); }}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-sans font-bold text-sm mt-6 transition-all"
            >
              BACK TO MAIN MENU
            </button>
          </motion.div>
        )}

        {/* FRIEND LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <motion.div 
            key="leaderboard-view"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-sans font-black tracking-tight">SWEET LEADERBOARD</h2>
            </div>

            <div className="flex-1 flex flex-col gap-2">
              {leaderboard.map((user) => (
                <div 
                  key={user.rank}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    user.isPlayer 
                      ? 'bg-purple-950/30 border-purple-500/40 shadow-md' 
                      : 'bg-slate-900/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Indicator */}
                    <span className={`w-6 font-mono text-center font-black ${user.rank === 1 ? 'text-amber-400 text-lg' : user.rank === 2 ? 'text-slate-300 text-base' : user.rank === 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {user.rank}
                    </span>

                    {/* Avatar Bubble */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs ${user.avatarColor}`}>
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <span className="font-sans font-bold text-sm text-white">
                        {user.name} {user.isPlayer && <span className="text-purple-400 text-xs font-semibold">(You)</span>}
                      </span>
                      <p className="text-[10px] text-slate-400">Level {user.level} reached</p>
                    </div>
                  </div>

                  <span className="font-mono text-sm font-bold text-slate-200">
                    {user.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { playClickSound(); setActiveTab('menu'); }}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-sans font-bold text-sm mt-6 transition-all"
            >
              BACK TO MAIN MENU
            </button>
          </motion.div>
        )}

        {/* SHOP TAB */}
        {activeTab === 'shop' && (
          <motion.div 
            key="shop-view"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-sans font-black tracking-tight">BOOSTER SHOP</h2>
              </div>
            </div>

            {/* Shop feedback alert */}
            {shopSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold p-3 rounded-xl text-center mb-4 animate-pulse">
                {shopSuccess}
              </div>
            )}

            <div className="flex-1 flex flex-col gap-3">
              {[
                { id: 'hammer', name: 'Lollipop Hammer', desc: 'Smashes any candy instantly.', cost: 100, icon: '🔨' },
                { id: 'shuffle', name: 'Sweet Shuffle', desc: 'Re-arranges all candies on the grid.', cost: 80, icon: '🔀' },
                { id: 'striped-brush', name: 'Striped Brush', desc: 'Paints column/row stripe on a candy.', cost: 120, icon: '🖌️' },
                { id: 'color-bomb-creator', name: 'Color Bomb Special', desc: 'Installs a shimmering color bomb.', cost: 200, icon: '🌈' },
              ].map((item) => (
                <div key={item.id} className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="font-sans font-bold text-sm text-white">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => buyBooster(item.id as BoosterType, item.cost)}
                    className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-slate-950 font-sans font-black text-xs px-3.5 py-2.5 rounded-xl transition-all"
                  >
                    <Coins className="w-4 h-4" />
                    {item.cost}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => { playClickSound(); setActiveTab('menu'); }}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-sans font-bold text-sm mt-6 transition-all"
            >
              BACK TO MAIN MENU
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LUCKY WHEEL POPUP */}
      <AnimatePresence>
        {showWheel && (
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
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center relative text-white"
            >
              {/* Close Button */}
              <button
                disabled={isSpinning}
                onClick={() => { playClickSound(); setShowWheel(false); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white disabled:opacity-30"
              >
                ✕
              </button>

              <h2 className="text-2xl font-sans font-black tracking-tight mb-1 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                LUCKY SPIN WHEEL
              </h2>
              <p className="text-xs text-slate-400 mb-6">Spin daily for spectacular rewards and gold boosters!</p>

              {/* The Wheel Visual Container */}
              <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
                {/* Needle pointers */}
                <div className="absolute top-[-10px] z-20 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />

                {/* Rotating wheel */}
                <motion.div
                  className="w-full h-full rounded-full border-4 border-slate-700 overflow-hidden relative shadow-[0_0_35px_rgba(20,184,166,0.25)] flex items-center justify-center"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #1e1b4b 20%, #0f172a 100%)',
                  }}
                  animate={{ rotate: wheelDegree }}
                  transition={{
                    duration: 4.2,
                    ease: [0.15, 0.85, 0.35, 1], // Realistic smooth slowdown
                  }}
                >
                  {/* Decorative colorful slices inside */}
                  {WHEEL_SECTOR_REWARDS.map((sector, i) => (
                    <div
                      key={i}
                      className="absolute w-full h-full origin-center flex justify-center pt-3 text-[10px] font-sans font-black text-white/90 select-none pointer-events-none"
                      style={{
                        transform: `rotate(${i * 45}deg)`,
                      }}
                    >
                      <div className="flex flex-col items-center gap-1.5 mt-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${sector.color} border border-white/20`} />
                        <span className="rotate-0 leading-tight w-14 text-center break-words truncate">
                          {sector.name}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Shimmering Center hub */}
                  <div className="absolute w-12 h-12 bg-slate-900 border-2 border-slate-600 rounded-full flex items-center justify-center shadow-lg z-10">
                    <div className="w-5 h-5 bg-yellow-400 rounded-full animate-ping opacity-30" />
                    <Sparkles className="w-5 h-5 text-yellow-400 absolute" />
                  </div>
                </motion.div>
              </div>

              {spinReward && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-sm text-emerald-400 font-bold mb-4 animate-bounce">
                  🎉 Congratulations! You won {spinReward}!
                </div>
              )}

              <button
                disabled={isSpinning}
                onClick={handleSpinWheel}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-40 text-slate-950 font-sans font-black py-3.5 rounded-xl transition-all shadow-lg hover:scale-103 active:scale-95 text-sm"
              >
                {isSpinning ? 'SPINNING THE WHEEL...' : 'SPIN FOR 100 COINS!'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
