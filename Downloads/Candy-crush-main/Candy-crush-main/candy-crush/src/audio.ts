/**
 * Real-time Sound Synthesis Engine using the Web Audio API.
 * Synthesizes a happy, looping retro background music (BGM) soundscape
 * and immersive match-3 game SFX entirely procedural-side.
 */

interface AudioSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

let settings: AudioSettings = {
  musicEnabled: true,
  sfxEnabled: true,
};

// Try loading persisted audio settings
if (typeof localStorage !== 'undefined') {
  try {
    const savedMusic = localStorage.getItem('bgm_music_enabled');
    const savedSfx = localStorage.getItem('bgm_sfx_enabled');
    if (savedMusic !== null) settings.musicEnabled = savedMusic === 'true';
    if (savedSfx !== null) settings.sfxEnabled = savedSfx === 'true';
  } catch (e) {
    // Fail silently in restricted environment
  }
}

let audioCtx: AudioContext | null = null;
let bgmIntervalId: any = null;
let currentBgmStep = 0;

// Upbeat pentatonic retro scale notes (frequencies in Hz)
const BGM_SCALE = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
];

const BGM_BASS = [
  130.81, // C3
  130.81, // C3
  146.83, // D3
  196.00, // G3
  164.81, // E3
  164.81, // E3
  220.00, // A3
  196.00, // G3
];

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  
  return audioCtx;
}

export function initAudio(): void {
  getAudioContext();
  startBgmLoop();
}

export function getAudioSettings() {
  return settings;
}

export function setMusicEnabled(enabled: boolean): void {
  settings.musicEnabled = enabled;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('bgm_music_enabled', enabled.toString());
  }
  if (enabled) {
    startBgmLoop();
  } else {
    stopBgmLoop();
  }
}

export function setSfxEnabled(enabled: boolean): void {
  settings.sfxEnabled = enabled;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('bgm_sfx_enabled', enabled.toString());
  }
}

/**
 * Procedural retro background music (BGM) generator
 */
export function startBgmLoop(): void {
  if (!settings.musicEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (bgmIntervalId) return; // Already running

  const tempoMs = 280; // Upbeat rhythm

  bgmIntervalId = setInterval(() => {
    if (!settings.musicEnabled) {
      stopBgmLoop();
      return;
    }
    
    const now = ctx.currentTime;
    
    // Play bass note every 2 steps
    if (currentBgmStep % 2 === 0) {
      const bassIndex = Math.floor(currentBgmStep / 2) % BGM_BASS.length;
      const bassFreq = BGM_BASS[bassIndex];
      playBgmSynthNote(bassFreq, 0.025, 'triangle', 0.2, now);
    }

    // Play sparkling melody notes with rhythmic probability
    const melodyChance = [0, 2, 4, 6].includes(currentBgmStep % 8) ? 0.8 : 0.3;
    if (Math.random() < melodyChance) {
      // Pick note based on a pleasant cycle
      const melodyFreq = BGM_SCALE[(currentBgmStep + (currentBgmStep % 3)) % BGM_SCALE.length];
      playBgmSynthNote(melodyFreq, 0.012, 'sine', 0.12, now);
    }

    currentBgmStep = (currentBgmStep + 1) % 16;
  }, tempoMs);
}

export function stopBgmLoop(): void {
  if (bgmIntervalId) {
    clearInterval(bgmIntervalId);
    bgmIntervalId = null;
  }
}

function playBgmSynthNote(
  frequency: number, 
  volume: number, 
  oscType: OscillatorType, 
  duration: number, 
  startTime: number
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = oscType;
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/**
 * SFX: Standard candy selection plop
 */
export function playClickSound(): void {
  if (!settings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

/**
 * SFX: Swap swoop
 */
export function playSwapSound(): void {
  if (!settings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(480, now + 0.12);

  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.12);
}

/**
 * SFX: Beautiful combo match bell arpeggios
 */
export function playMatchSound(combo: number = 1): void {
  if (!settings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  const baseScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
  const index = (combo - 1) % baseScale.length;
  const octaveBoost = 1 + Math.floor((combo - 1) / baseScale.length) * 0.5;
  const freq = baseScale[index] * octaveBoost;

  // Synthesis of an FM-style synth bell
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const modGain = ctx.createGain();
  const mainGain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, now);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.5, now); // modulator

  modGain.gain.setValueAtTime(freq * 0.8, now);
  modGain.gain.exponentialRampToValueAtTime(1, now + 0.25);

  mainGain.gain.setValueAtTime(0.08, now);
  mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  // FM Connection
  osc2.connect(modGain);
  modGain.connect(osc1.frequency);
  osc1.connect(mainGain);
  mainGain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.3);
  osc2.stop(now + 0.3);
}

/**
 * SFX: Loud candy crush explosion with a white noise crackle
 */
export function playExplosionSound(): void {
  if (!settings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Low frequency boom
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.linearRampToValueAtTime(40, now + 0.35);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.4);

  // Simulating noise crackle
  const noiseOsc = ctx.createOscillator();
  const noiseGain = ctx.createGain();
  noiseOsc.type = 'triangle';
  noiseOsc.frequency.setValueAtTime(800, now);
  noiseOsc.frequency.linearRampToValueAtTime(100, now + 0.2);

  noiseGain.gain.setValueAtTime(0.05, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  noiseOsc.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noiseOsc.start(now);
  noiseOsc.stop(now + 0.2);
}

/**
 * SFX: Obstacle smashed (rock, ice, chocolate cracking)
 */
export function playObstacleBreakSound(): void {
  if (!settings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(250, now);
  osc.frequency.linearRampToValueAtTime(80, now + 0.18);

  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

/**
 * SFX: Wheel spin tick
 */
export function playWheelTickSound(): void {
  if (!settings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.035);
}

/**
 * SFX: Science-fiction booster activations
 */
export function playBoosterSound(): void {
  if (!settings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(1500, now + 0.35);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.07, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.4);
}

/**
 * SFX: Ascending happy chord arpeggios on level complete
 */
export function playLevelUpSound(): void {
  if (!settings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major
  
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.07);

    gain.gain.setValueAtTime(0, now + idx * 0.07);
    gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.07 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.07);
    osc.stop(now + idx * 0.07 + 0.35);
  });
}

/**
 * SFX: Sad descending minor chord progression on level failures
 */
export function playGameOverSound(): void {
  if (!settings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [196.00, 155.56, 130.81, 98.00]; // G Minor descend
  
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.15);
    osc.frequency.linearRampToValueAtTime(freq * 0.85, now + idx * 0.15 + 0.4);

    gain.gain.setValueAtTime(0, now + idx * 0.15);
    gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.15 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.15);
    osc.stop(now + idx * 0.15 + 0.55);
  });
}
