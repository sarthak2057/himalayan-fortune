import { SymbolId, SymbolDef } from './types';

export const GRID_ROWS = 5;
export const GRID_COLS = 6;
export const MIN_MATCH_FOR_WIN = 8; // Scatter pay mechanic

// Jackpot Configuration
export const JACKPOT_SEED = 5000;
export const JACKPOT_CONTRIBUTION_RATE = 0.02; // 2% of every bet goes to jackpot
export const JACKPOT_TRIGGER_SYMBOL = SymbolId.SCATTER;
export const JACKPOT_TRIGGER_COUNT = 10; // Hit 10+ Scatters to win jackpot

export const SYMBOLS: Record<SymbolId, SymbolDef> = {
  [SymbolId.SCATTER]: { id: SymbolId.SCATTER, name: 'Mandala', icon: '☸️', color: 'text-purple-400', multiplier: 50, frequency: 2 },
  [SymbolId.WILD]:    { id: SymbolId.WILD, name: 'Golden Stupa', icon: '🏯', color: 'text-yellow-400', multiplier: 0, frequency: 3 }, // Wilds complicated in scatter, used as high value here
  [SymbolId.H1]:      { id: SymbolId.H1, name: 'Everest', icon: '🏔️', color: 'text-blue-200', multiplier: 20, frequency: 5 },
  [SymbolId.H2]:      { id: SymbolId.H2, name: 'Yak', icon: '🐂', color: 'text-stone-400', multiplier: 10, frequency: 8 },
  [SymbolId.H3]:      { id: SymbolId.H3, name: 'Khukuri', icon: '🗡️', color: 'text-zinc-300', multiplier: 8, frequency: 10 },
  [SymbolId.L1]:      { id: SymbolId.L1, name: 'Madal', icon: '🪘', color: 'text-orange-600', multiplier: 4, frequency: 15 },
  [SymbolId.L2]:      { id: SymbolId.L2, name: 'Lantern', icon: '🏮', color: 'text-red-500', multiplier: 3, frequency: 18 },
  [SymbolId.L3]:      { id: SymbolId.L3, name: 'Coin', icon: '🪙', color: 'text-yellow-600', multiplier: 2, frequency: 20 },
  [SymbolId.L4]:      { id: SymbolId.L4, name: 'Flag', icon: '🚩', color: 'text-blue-500', multiplier: 1, frequency: 25 },
};

export const SYMBOL_KEYS = Object.keys(SYMBOLS) as SymbolId[];

// Weighted random selection
export const getRandomSymbol = (): SymbolId => {
  const totalWeight = SYMBOL_KEYS.reduce((sum, key) => sum + SYMBOLS[key].frequency, 0);
  let random = Math.random() * totalWeight;
  
  for (const key of SYMBOL_KEYS) {
    random -= SYMBOLS[key].frequency;
    if (random <= 0) return key;
  }
  return SymbolId.L4; // Fallback
};

export const calculateWin = (count: number, symbolId: SymbolId, bet: number): number => {
  if (count < MIN_MATCH_FOR_WIN) return 0;
  const symbol = SYMBOLS[symbolId];
  
  // Simple logic: Base Multiplier * (Count - Min + 1) * Bet * Scaling Factor
  // Example: 8 flags ($1 bet) = 1 * 1 * 1 * 0.1 = 0.10
  // Example: 12 Yaks ($1 bet) = 10 * 5 * 1 * 0.1 = 5.00
  const scaling = 0.05; 
  const matchBonus = (count - MIN_MATCH_FOR_WIN) * 0.5 + 1;
  
  return Math.floor(symbol.multiplier * matchBonus * bet * scaling * 100) / 100;
};