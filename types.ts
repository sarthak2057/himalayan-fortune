export enum SymbolId {
  SCATTER = 'SCATTER', // Mandala
  WILD = 'WILD',       // Golden Buddha
  H1 = 'H1',           // Mt Everest
  H2 = 'H2',           // Yak
  H3 = 'H3',           // Khukuri
  L1 = 'L1',           // Drum
  L2 = 'L2',           // Lantern
  L3 = 'L3',           // Coin
  L4 = 'L4',           // Flag
}

export interface SymbolDef {
  id: SymbolId;
  name: string;
  icon: string; // Emoji or char for simplicity in this demo, or Lucide icon name
  color: string;
  multiplier: number; // Base multiplier for min matches
  frequency: number; // Weight for RNG (higher = more common)
}

export interface GridCell {
  id: string; // unique ID for key
  symbol: SymbolId;
  isWin: boolean;
  isNew: boolean;
}

export interface WinResult {
  symbolId: SymbolId;
  count: number;
  payout: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export interface AgentResponse {
  text: string;
  creditsAdded?: number;
}