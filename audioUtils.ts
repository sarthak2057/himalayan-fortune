
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
};

export const resumeAudio = () => {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(console.error);
  }
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, vol: number = 0.1) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio errors
  }
};

export const playClick = () => {
  createOscillator('sine', 800, 0.1, 0.05);
};

export const playSpin = () => {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const duration = 1.5; // Slightly longer for rolling effect
    
    // Create a "ratchet" sound using a sawtooth wave with a filter envelope
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, now);
    osc.frequency.linearRampToValueAtTime(200, now + duration);
    
    filter.type = 'bandpass';
    filter.Q.value = 10;
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.linearRampToValueAtTime(600, now + duration);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + duration);
  } catch (e) {}
};

export const playReelStop = () => {
  try {
    const ctx = getCtx();
    // Mechanical thud
    createOscillator('square', 80, 0.08, 0.08);
    createOscillator('sine', 40, 0.15, 0.15);
  } catch (e) {}
};

export const playWin = () => {
  const ctx = getCtx();
  // Simple major triad
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    setTimeout(() => {
        createOscillator('triangle', freq, 0.3, 0.1);
    }, i * 100);
  });
};

export const playBigWin = () => {
  // Fanfare
  const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    setTimeout(() => {
        createOscillator('square', freq, 0.4, 0.08);
    }, i * 120);
  });
};

export const playJackpot = () => {
  const ctx = getCtx();
  // Fast arpeggios going up
  const baseFreqs = [261.63, 329.63, 392.00, 523.25];
  
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
       const freq = baseFreqs[i % 4] * (1 + Math.floor(i/4));
       createOscillator('sawtooth', freq, 0.1, 0.1);
    }, i * 80);
  }
  
  // Final crash
  setTimeout(() => {
      createOscillator('square', 110, 1.0, 0.2);
  }, 1600);
};

export const playCoin = () => {
  // High pitch metal sound
  createOscillator('sine', 2000, 0.5, 0.05);
};