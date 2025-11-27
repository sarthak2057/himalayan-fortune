import React, { useState, useEffect, useCallback } from 'react';
import { AgentPanel } from './components/AgentPanel';
import { WinNotification } from './components/WinNotification';
import { 
  SymbolId, 
  GridCell, 
  WinResult 
} from './types';
import { 
  GRID_ROWS, 
  GRID_COLS, 
  SYMBOLS, 
  getRandomSymbol, 
  calculateWin,
  JACKPOT_SEED,
  JACKPOT_CONTRIBUTION_RATE,
  JACKPOT_TRIGGER_SYMBOL,
  JACKPOT_TRIGGER_COUNT
} from './constants';
import { Volume2, VolumeX, Wallet, RefreshCw, Crown } from 'lucide-react';
import { playClick, playSpin, playWin, playBigWin, playCoin, playJackpot, playReelStop, resumeAudio } from './audioUtils';

const INITIAL_CREDITS = 1000;
const BET_SIZES = [10, 20, 50, 100, 200, 500];

// --- 3D HIGH-FIDELITY SYMBOL COMPONENTS ---

// 1. SCATTER (Mandala) - Existing
const MandalaScatter = ({ className }: { className?: string }) => (
  <div className={`relative w-full h-full ${className || ''}`} style={{ transformStyle: 'preserve-3d' }}>
    <div className="absolute inset-0 pointer-events-none" style={{ transform: 'translateZ(-20px)' }}>
      {Array.from({length: 12}).map((_, i) => {
        const isGold = i % 2 === 0;
        return (
        <div 
            key={i} 
            className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full animate-scatter-particle ${isGold ? 'bg-yellow-300 shadow-[0_0_4px_gold]' : 'bg-red-400 shadow-[0_0_4px_red]'}`}
            style={{
                '--rot': `${i * 30}deg`, 
                '--dist': `${60 + Math.random() * 20}px`,
                '--delay': `${Math.random() * 0.1}s`
            } as React.CSSProperties} 
        />
      )})}
    </div>
    <div className="absolute inset-0" style={{ transform: 'translateZ(0px)' }}>
       <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="m-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <filter id="m-glow">
              <feGaussianBlur stdDeviation="1" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#m-gold)" stroke="#78350F" strokeWidth="1" filter="url(#m-glow)" />
          <circle cx="50" cy="50" r="18" fill="#292524" stroke="#F59E0B" strokeWidth="2" />
       </svg>
    </div>
    <div className="absolute inset-0" style={{ transform: 'translateZ(12px)' }}>
       <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <g fill="url(#m-gold)" stroke="#92400E" strokeWidth="0.5">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <path key={i} d="M50 50 Q60 20 50 6 Q40 20 50 50" transform={`rotate(${deg} 50 50)`} />
            ))}
          </g>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#FEF3C7" strokeWidth="2" strokeDasharray="2,4" opacity="0.6"/>
       </svg>
    </div>
    <div className="absolute inset-0" style={{ transform: 'translateZ(25px)' }}>
       <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
         <defs>
            <radialGradient id="m-gem" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="60%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </radialGradient>
            <filter id="m-shadow">
              <feOffset dx="0" dy="1" />
              <feGaussianBlur stdDeviation="1" result="offset-blur" />
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
              <feFlood floodColor="black" floodOpacity="0.7" result="color" />
              <feComposite operator="in" in="color" in2="inverse" result="shadow" />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>
         </defs>
         <path d="M50 36 L64 50 L50 64 L36 50 Z" fill="url(#m-gem)" stroke="#991B1B" strokeWidth="0.5" filter="url(#m-shadow)" />
         <ellipse cx="46" cy="44" rx="3" ry="1.5" fill="white" opacity="0.8" transform="rotate(-45 46 44)" />
       </svg>
    </div>
  </div>
);

// 2. WILD (Golden Stupa/Eyes)
const WildSymbol = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}>
      <defs>
        <radialGradient id="wild-gold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#854D0E" />
        </radialGradient>
        <filter id="wild-bevel" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="2" dy="2" result="offsetBlur" />
          <feSpecularLighting in="blur" surfaceScale="5" specularConstant=".75" specularExponent="20" lightingColor="#bbbbbb" result="specOut">
            <fePointLight x="-5000" y="-10000" z="20000" />
          </feSpecularLighting>
          <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
          <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#wild-gold)" stroke="#713F12" strokeWidth="2" filter="url(#wild-bevel)" />
      {/* Eyes */}
      <g transform="translate(0, 0)">
         <path d="M20 45 Q50 65 80 45" fill="none" stroke="#451a03" strokeWidth="3" strokeLinecap="round" /> 
         <path d="M50 45 Q45 60 50 70" fill="none" stroke="#451a03" strokeWidth="3" />
         <path d="M25 40 Q35 25 45 40 Q35 50 25 40" fill="white" stroke="#451a03" strokeWidth="1" />
         <circle cx="35" cy="38" r="3" fill="#1e3a8a" />
         <path d="M55 40 Q65 25 75 40 Q65 50 55 40" fill="white" stroke="#451a03" strokeWidth="1" />
         <circle cx="65" cy="38" r="3" fill="#1e3a8a" />
         <circle cx="50" cy="30" r="2.5" fill="#dc2626" />
      </g>
      <path d="M15 80 Q50 90 85 80" fill="none" stroke="#713F12" strokeWidth="1.5" strokeDasharray="3,3" />
      <text x="50" y="85" fontSize="10" fontWeight="bold" fill="#451a03" textAnchor="middle" fontFamily="serif" letterSpacing="2">WILD</text>
    </svg>
  </div>
);

// 3. H1 (Everest)
const EverestSymbol = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
        <linearGradient id="mt-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F3F4F6" />
          <stop offset="50%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="90" height="90" rx="15" fill="url(#sky-grad)" stroke="#1e3a8a" strokeWidth="3" />
      <path d="M10 85 L50 20 L90 85 Z" fill="url(#mt-grad)" stroke="#1F2937" strokeWidth="1" strokeLinejoin="round" />
      <path d="M50 20 L65 50 L55 45 L50 55 L45 45 L35 50 Z" fill="white" opacity="0.9" />
      <circle cx="20" cy="20" r="8" fill="#FCD34D" opacity="0.9" filter="blur(1px)" />
      <path d="M10 85 L90 85 L90 60 L10 60" fill="white" opacity="0.2" /> {/* Mist */}
    </svg>
  </div>
);

// 4. H2 (Yak)
const YakSymbol = ({ className }: { className?: string }) => (
  <div className={className}>
     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))' }}>
      <defs>
        <radialGradient id="coin-bronze" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D6D3D1" />
          <stop offset="60%" stopColor="#78716C" />
          <stop offset="100%" stopColor="#44403C" />
        </radialGradient>
        <linearGradient id="yak-fur" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#57534E" />
            <stop offset="100%" stopColor="#292524" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#coin-bronze)" stroke="#292524" strokeWidth="1" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#44403C" strokeWidth="1" strokeDasharray="2,2" />
      
      {/* Head */}
      <path d="M30 45 Q50 90 70 45 Q70 25 50 25 Q30 25 30 45" fill="url(#yak-fur)" />
      {/* Horns */}
      <path d="M32 40 C 20 35, 15 20, 25 10" fill="none" stroke="#E7E5E4" strokeWidth="4" strokeLinecap="round" />
      <path d="M68 40 C 80 35, 85 20, 75 10" fill="none" stroke="#E7E5E4" strokeWidth="4" strokeLinecap="round" />
      {/* Snout */}
      <ellipse cx="50" cy="65" rx="12" ry="8" fill="#1C1917" />
      <circle cx="46" cy="65" r="2" fill="#57534E" />
      <circle cx="54" cy="65" r="2" fill="#57534E" />
      {/* Eyes */}
      <circle cx="40" cy="45" r="2.5" fill="white" />
      <circle cx="40" cy="45" r="1" fill="black" />
      <circle cx="60" cy="45" r="2.5" fill="white" />
      <circle cx="60" cy="45" r="1" fill="black" />
     </svg>
  </div>
);

// 5. H3 (Khukuri)
const KhukuriSymbol = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl" style={{ transform: 'rotate(-45deg)' }}>
       <defs>
         <linearGradient id="blade-grad" x1="0" y1="0" x2="1" y2="0">
           <stop offset="0%" stopColor="#E5E7EB" />
           <stop offset="40%" stopColor="#9CA3AF" />
           <stop offset="50%" stopColor="#F3F4F6" /> {/* Shine */}
           <stop offset="100%" stopColor="#4B5563" />
         </linearGradient>
       </defs>
       {/* Handle */}
       <rect x="42" y="65" width="16" height="25" rx="4" fill="#451A03" stroke="#271306" strokeWidth="1" transform="rotate(15 50 77)" />
       {/* Blade */}
       <path d="M48 68 C 20 60, 20 20, 40 10 C 60 10, 65 50, 62 68 Z" fill="url(#blade-grad)" stroke="#374151" strokeWidth="1" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.5))" />
       {/* Notch */}
       <path d="M48 58 L 50 60 L 48 62" fill="none" stroke="#1F2937" strokeWidth="1" />
    </svg>
  </div>
);

// 6. L1 (Madal)
const MadalSymbol = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="wood-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      {/* Body */}
      <path d="M20 30 L80 30 L90 50 L80 70 L20 70 L10 50 Z" fill="url(#wood-grad)" stroke="#451A03" strokeWidth="2" />
      {/* Straps */}
      <path d="M25 30 L35 70 M45 30 L55 70 M65 30 L75 70" stroke="#FEF3C7" strokeWidth="2" opacity="0.7" />
      {/* Ends */}
      <ellipse cx="10" cy="50" rx="5" ry="20" fill="#1F2937" />
      <ellipse cx="90" cy="50" rx="5" ry="20" fill="#1F2937" />
      {/* Black Paste (Khari) */}
      <circle cx="50" cy="50" r="10" fill="#111827" stroke="#4B5563" strokeWidth="1" />
    </svg>
  </div>
);

// 7. L2 (Lantern)
const LanternSymbol = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <radialGradient id="lantern-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </radialGradient>
      </defs>
      {/* Top Cap */}
      <rect x="35" y="10" width="30" height="5" rx="1" fill="#1F2937" />
      <rect x="48" y="5" width="4" height="5" fill="#F59E0B" />
      {/* Body */}
      <rect x="25" y="15" width="50" height="60" rx="15" fill="url(#lantern-glow)" stroke="#7F1D1D" strokeWidth="1" />
      {/* Ribs */}
      <path d="M25 30 H75 M25 45 H75 M25 60 H75" stroke="#7F1D1D" strokeWidth="1" opacity="0.5" />
      {/* Bottom Cap */}
      <rect x="35" y="75" width="30" height="5" rx="1" fill="#1F2937" />
      {/* Tassel */}
      <path d="M50 80 L50 95" stroke="#EF4444" strokeWidth="3" />
      <circle cx="50" cy="95" r="2" fill="#F59E0B" />
    </svg>
  </div>
);

// 8. L3 (Coin)
const CoinSymbol = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" style={{ filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.4))' }}>
      <defs>
         <radialGradient id="coin-gold" cx="50%" cy="50%" r="50%">
           <stop offset="0%" stopColor="#FDE047" />
           <stop offset="70%" stopColor="#EAB308" />
           <stop offset="100%" stopColor="#A16207" />
         </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#coin-gold)" stroke="#854D0E" strokeWidth="2" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#CA8A04" strokeWidth="2" strokeDasharray="4,2" />
      <rect x="40" y="40" width="20" height="20" rx="2" fill="none" stroke="#854D0E" strokeWidth="2" transform="rotate(45 50 50)" />
      <text x="50" y="54" fontSize="24" fontWeight="bold" fill="#713F12" textAnchor="middle">रु</text>
    </svg>
  </div>
);

// 9. L4 (Flag)
const FlagSymbol = ({ className }: { className?: string }) => (
    <div className={className}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.4))' }}>
            <defs>
                <linearGradient id="flag-wave" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#DC143C" />
                    <stop offset="50%" stopColor="#B91C1C" />
                    <stop offset="100%" stopColor="#991B1B" />
                </linearGradient>
            </defs>
            {/* Pole */}
            <rect x="20" y="5" width="4" height="90" fill="#4B5563" rx="2" />
            <circle cx="22" cy="5" r="3" fill="#F59E0B" />
            
            {/* Flag Shape - Nepal's double triangle */}
            <path d="M24 10 L80 40 L24 40 L65 75 L24 75" fill="url(#flag-wave)" stroke="#1E3A8A" strokeWidth="2" strokeLinejoin="round" />
            
            {/* Moon */}
            <path d="M30 32 Q35 35 40 32 Q35 28 30 32" fill="white" />
            {/* Sun */}
            <circle cx="35" cy="60" r="5" fill="white" opacity="0.9" />
        </svg>
    </div>
);

// --- END SYMBOL COMPONENTS ---

// Advanced Win Visuals - Simulating Lottie with CSS/SVG
const WinEffect = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-lg">
    {/* Spinning God Rays */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-rays opacity-50">
       <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(234,179,8,0.3)_20deg,transparent_40deg,rgba(234,179,8,0.3)_60deg,transparent_80deg,rgba(234,179,8,0.3)_100deg,transparent_120deg,rgba(234,179,8,0.3)_140deg,transparent_160deg,rgba(234,179,8,0.3)_180deg,transparent_200deg,rgba(234,179,8,0.3)_220deg,transparent_240deg,rgba(234,179,8,0.3)_260deg,transparent_280deg,rgba(234,179,8,0.3)_300deg,transparent_320deg,rgba(234,179,8,0.3)_340deg)]"></div>
    </div>
    {/* Inner Glow Pulse */}
    <div className="absolute inset-0 bg-yellow-500/20 animate-pulse mix-blend-overlay"></div>
    {/* Border Flare */}
    <div className="absolute inset-0 border-2 border-yellow-300/60 rounded-lg shadow-[inset_0_0_15px_rgba(234,179,8,0.4)]"></div>
  </div>
);

const LightningOverlay = () => (
    <div className="lightning-overlay"></div>
);

function App() {
  // State
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [betIndex, setBetIndex] = useState(1); // Default 20
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningCols, setSpinningCols] = useState<boolean[]>(new Array(GRID_COLS).fill(false));
  
  const [winResults, setWinResults] = useState<WinResult[]>([]);
  const [totalWin, setTotalWin] = useState(0);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Jackpot State with local storage persistence logic
  const [jackpot, setJackpot] = useState(() => {
    const saved = localStorage.getItem('himalayan_jackpot');
    return saved ? parseFloat(saved) : JACKPOT_SEED;
  });
  const [justWonJackpot, setJustWonJackpot] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const currentBet = BET_SIZES[betIndex];

  useEffect(() => {
    localStorage.setItem('himalayan_jackpot', jackpot.toString());
  }, [jackpot]);

  const playSound = useCallback((type: 'click' | 'spin' | 'win' | 'bigWin' | 'coin' | 'jackpot' | 'reelStop') => {
    if (!soundEnabled) return;
    
    // Ensure audio context is active
    resumeAudio();

    switch (type) {
      case 'click': playClick(); break;
      case 'spin': playSpin(); break;
      case 'win': playWin(); break;
      case 'bigWin': playBigWin(); break;
      case 'coin': playCoin(); break;
      case 'jackpot': playJackpot(); break;
      case 'reelStop': playReelStop(); break;
    }
  }, [soundEnabled]);

  // Initialize Grid
  useEffect(() => {
    const initialGrid: GridCell[] = [];
    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
      initialGrid.push({
        id: `cell-${i}-${Date.now()}`,
        symbol: getRandomSymbol(),
        isWin: false,
        isNew: false
      });
    }
    setGrid(initialGrid);
  }, []);

  // Spin Logic
  const spin = useCallback(() => {
    if (credits < currentBet) {
      setIsAgentOpen(true); // Open agent if broke
      setAutoSpin(false);
      return;
    }

    setJustWonJackpot(false);
    setShowBadge(false);
    setIsSpinning(true);
    setSpinningCols(new Array(GRID_COLS).fill(true)); // All cols spinning
    setWinResults([]);
    setTotalWin(0);
    setCredits(prev => prev - currentBet);
    
    // Increase Jackpot
    const contribution = currentBet * JACKPOT_CONTRIBUTION_RATE;
    setJackpot(prev => prev + contribution);
    
    playSound('spin');

    // 1. Pre-calculate the entire outcome
    const targetSymbols: SymbolId[] = [];
    const counts: Record<string, number> = {};

    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
      const sym = getRandomSymbol();
      targetSymbols.push(sym);
      counts[sym] = (counts[sym] || 0) + 1;
    }

    // 2. Calculate Wins (for later use)
    let roundWin = 0;
    const roundResults: WinResult[] = [];
    const winningSymbols = new Set<SymbolId>();
    let jackpotHit = false;

    Object.entries(counts).forEach(([symId, count]) => {
      const winAmt = calculateWin(count, symId as SymbolId, currentBet);
      if (winAmt > 0) {
        roundWin += winAmt;
        roundResults.push({
          symbolId: symId as SymbolId,
          count,
          payout: winAmt
        });
        winningSymbols.add(symId as SymbolId);
      }
      
      if (symId === JACKPOT_TRIGGER_SYMBOL && count >= JACKPOT_TRIGGER_COUNT) {
          jackpotHit = true;
          winningSymbols.add(symId as SymbolId); 
      }
    });

    let finalRoundWin = roundWin;
    let wonJackpotAmount = 0;

    if (jackpotHit) {
        wonJackpotAmount = jackpot;
        finalRoundWin += wonJackpotAmount;
    }

    // 3. Sequence column stops (Reel Roll)
    const stopColumn = (colIndex: number) => {
      setGrid(prevGrid => {
        const newGrid = [...prevGrid];
        for (let r = 0; r < GRID_ROWS; r++) {
          const idx = r * GRID_COLS + colIndex;
          newGrid[idx] = {
            ...newGrid[idx],
            symbol: targetSymbols[idx],
            id: `cell-${idx}-${Date.now()}`, // Force re-render for particles
            isNew: true,
            isWin: false
          };
        }
        return newGrid;
      });
      setSpinningCols(prev => {
        const next = [...prev];
        next[colIndex] = false;
        return next;
      });
      playSound('reelStop');
    };

    const delays = [300, 500, 700, 900, 1100, 1300];
    delays.forEach((delay, colIdx) => {
      setTimeout(() => stopColumn(colIdx), delay);
    });

    // 4. Finalize (After last column stops)
    setTimeout(() => {
      setIsSpinning(false);

      // Apply Win States
      setGrid(prev => prev.map(cell => ({
        ...cell,
        isWin: winningSymbols.has(cell.symbol),
        isNew: false
      })));

      setWinResults(roundResults);
      setTotalWin(finalRoundWin);
      setCredits(prev => prev + finalRoundWin);

      if (finalRoundWin > currentBet) {
          setShowBadge(true);
          setTimeout(() => setShowBadge(false), 3000);
      }

      if (jackpotHit) {
          setJustWonJackpot(true);
          setJackpot(JACKPOT_SEED);
          playSound('jackpot');
      } else if (finalRoundWin > 0) {
        if (finalRoundWin >= currentBet * 10) {
            playSound('bigWin');
        } else {
            playSound('win');
        }
      }
    }, 2000); 

  }, [credits, currentBet, jackpot, playSound]);

  // Auto Spin Effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (autoSpin && !isSpinning) {
      timer = setTimeout(() => {
        spin();
      }, 1500); // Delay between auto spins
    }
    return () => clearTimeout(timer);
  }, [autoSpin, isSpinning, spin]);

  const handleAddCredits = (amount: number) => {
    setCredits(prev => prev + amount);
    playSound('coin');
  };

  const handleGenericClick = () => {
    playSound('click');
  }

  // Symbol Renderer Logic
  const renderSymbol = (symbolId: SymbolId, className: string) => {
     switch (symbolId) {
       case SymbolId.SCATTER: return <MandalaScatter className={className} />;
       case SymbolId.WILD: return <WildSymbol className={className} />;
       case SymbolId.H1: return <EverestSymbol className={className} />;
       case SymbolId.H2: return <YakSymbol className={className} />;
       case SymbolId.H3: return <KhukuriSymbol className={className} />;
       case SymbolId.L1: return <MadalSymbol className={className} />;
       case SymbolId.L2: return <LanternSymbol className={className} />;
       case SymbolId.L3: return <CoinSymbol className={className} />;
       case SymbolId.L4: return <FlagSymbol className={className} />;
       default: return <div className={className}>{SYMBOLS[symbolId as SymbolId]?.icon}</div>;
     }
  };

  return (
    <div className="min-h-screen bg-[#1a0505] text-yellow-50 flex flex-col font-sans overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2671&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none"></div>
      
      {/* Jackpot Lightning Effect */}
      {justWonJackpot && <LightningOverlay />}

      {/* Header */}
      <header className="relative z-20 flex justify-between items-center px-4 py-3 bg-red-950/90 border-b border-yellow-700 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center border-2 border-yellow-300 shadow-inner">
            <span className="text-2xl">☸️</span>
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 nepali-title leading-tight">
              Himalayan<br/><span className="text-sm md:text-lg text-yellow-100 font-normal">Fortune</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-xs text-yellow-400 uppercase tracking-widest">Balance</span>
            <span className="text-xl font-mono font-bold text-white tabular-nums">{credits.toFixed(2)}</span>
          </div>
          <button 
            onClick={() => {
                setIsAgentOpen(true);
                handleGenericClick();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white px-3 py-1.5 rounded-full border border-yellow-400 shadow-lg transition-all transform hover:scale-105 active:scale-95"
          >
            <Wallet size={18} />
            <span className="text-sm font-bold hidden sm:inline">Agent</span>
          </button>
          <button 
            onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playClick(); // Play feedback if enabling
            }} 
            className="p-2 text-yellow-400 hover:text-yellow-200"
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 md:p-6">
        
        {/* Jackpot Banner */}
        <div className="w-full max-w-3xl mb-4 relative">
            <div className="bg-gradient-to-r from-red-900 via-red-600 to-red-900 border-y-4 border-yellow-500 text-center py-2 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.5)] relative overflow-hidden">
                {/* Animated Shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                
                <div className="flex flex-col items-center justify-center relative z-10">
                    <div className="flex items-center gap-2 text-yellow-200 text-sm uppercase tracking-[0.2em] font-bold mb-1">
                        <Crown size={16} className="text-yellow-400" />
                        Progressive Jackpot
                        <Crown size={16} className="text-yellow-400" />
                    </div>
                    <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 drop-shadow-md nepali-title tabular-nums">
                        {jackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-yellow-200/80 mt-1">
                        Collect {JACKPOT_TRIGGER_COUNT} Mandalas to Win!
                    </div>
                </div>
            </div>
        </div>

        {/* Game Grid Container */}
        <div className="relative w-full max-w-3xl aspect-[6/5] md:aspect-[6/4.5] bg-red-950/80 rounded-xl border-[6px] border-yellow-700 shadow-2xl p-2 md:p-4 backdrop-blur-md">
            {/* Decorative Corners */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg"></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg"></div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-yellow-400 rounded-br-lg"></div>

            {/* The Grid */}
            <div 
              className="grid grid-cols-6 grid-rows-5 gap-1 md:gap-2 w-full h-full"
            >
              {grid.map((cell, idx) => {
                const colIndex = idx % GRID_COLS;
                const isReelSpinning = spinningCols[colIndex];
                
                const symDef = SYMBOLS[cell.symbol];
                const isScatter = cell.symbol === SymbolId.SCATTER;

                let symbolClassName = "text-3xl md:text-5xl filter drop-shadow-lg transform transition-transform relative z-10 w-full h-full p-1";
                
                if (!isReelSpinning) {
                    if (justWonJackpot) {
                        symbolClassName += " animate-pop-shake";
                    }
                    
                    if (isScatter) {
                        if (cell.isNew) {
                            symbolClassName += " scatter-land";
                        } else if (cell.isWin) {
                            symbolClassName += " scatter-win";
                        } else if (!justWonJackpot) {
                             symbolClassName += " scatter-idle";
                        }
                    } else {
                        // Regular Symbol
                        if (cell.isWin && !justWonJackpot) {
                            symbolClassName += " animate-pop-shake";
                        }
                    }
                }

                return (
                  <div 
                    key={cell.id}
                    className={`
                      relative rounded-lg flex items-center justify-center
                      bg-gradient-to-b from-stone-800 to-stone-900 border border-stone-700 shadow-inner
                      transition-all duration-300 overflow-hidden
                      ${cell.isWin && !isScatter && !isReelSpinning ? 'z-10 bg-red-900/50' : ''}
                      ${isScatter ? 'perspective-container' : ''}
                      ${isReelSpinning ? 'spin-blur-motion' : ''}
                    `}
                  >
                     {/* Render Win Effect Background if Winning */}
                     {cell.isWin && !isReelSpinning && <WinEffect />}
                     
                     {/* Symbol Content */}
                     {isReelSpinning ? (
                        <div className="rolling-strip"></div>
                     ) : (
                        renderSymbol(cell.symbol, symbolClassName)
                     )}
                     
                     {/* Multiplier Badge (visual flare only) */}
                     {!isScatter && !isReelSpinning && symDef.multiplier > 10 && (
                        <div className="absolute bottom-0 right-0 text-[8px] md:text-[10px] bg-yellow-600 text-white px-1 rounded-tl opacity-80 z-20">
                           High
                        </div>
                     )}
                  </div>
                );
              })}
            </div>

            {/* Total Win Overlay (Floating) */}
            {totalWin > 0 && !isSpinning && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className={`
                     bg-black/60 backdrop-blur-sm p-4 rounded-2xl border-2 border-yellow-500 animate-bounce relative
                     ${justWonJackpot ? 'scale-125 shadow-[0_0_50px_rgba(234,179,8,1)]' : ''}
                  `}>
                    <div className="text-yellow-300 text-lg font-bold uppercase tracking-widest text-center">
                        {justWonJackpot ? 'JACKPOT HIT!' : 'Total Win'}
                    </div>
                    <div className="text-4xl md:text-6xl font-black text-white text-center drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">
                       {totalWin.toFixed(2)}
                    </div>
                    
                    {/* Standard Multiplier Badge */}
                    {totalWin > currentBet && showBadge && (
                        <div className="absolute -top-4 -right-8 bg-gradient-to-r from-red-600 to-red-500 text-white text-lg font-black px-3 py-1 rounded-full border-2 border-yellow-400 shadow-lg animate-pop-shake flex items-center justify-center z-30">
                           {(totalWin / currentBet).toFixed(1).replace(/\.0$/, '')}x
                        </div>
                    )}
                  </div>
               </div>
            )}
        </div>

        {/* Controls */}
        <div className="w-full max-w-3xl mt-4 md:mt-8 bg-stone-900/90 border border-yellow-800 rounded-xl p-4 shadow-2xl flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-md">
          
          {/* Bet Selector */}
          <div className="flex flex-col w-full md:w-auto gap-1">
             <label className="text-xs text-stone-400 uppercase font-bold tracking-wider">Total Bet</label>
             <div className="flex items-center bg-stone-800 rounded-lg p-1 border border-stone-700">
                <button 
                  onClick={() => {
                    setBetIndex(Math.max(0, betIndex - 1));
                    handleGenericClick();
                  }}
                  disabled={isSpinning}
                  className="w-10 h-10 flex items-center justify-center bg-stone-700 hover:bg-stone-600 text-yellow-500 font-bold rounded transition disabled:opacity-50"
                >-</button>
                <div className="flex-1 px-4 text-center font-mono text-xl font-bold text-white min-w-[80px]">
                   {currentBet}
                </div>
                <button 
                  onClick={() => {
                    setBetIndex(Math.min(BET_SIZES.length - 1, betIndex + 1));
                    handleGenericClick();
                  }}
                  disabled={isSpinning}
                  className="w-10 h-10 flex items-center justify-center bg-stone-700 hover:bg-stone-600 text-yellow-500 font-bold rounded transition disabled:opacity-50"
                >+</button>
             </div>
          </div>

          {/* Info/Stats (Hidden on small mobile) */}
          <div className="hidden md:flex flex-col items-center">
             <div className="text-xs text-stone-500">SCATTER PAYS</div>
             <div className="text-yellow-600 font-bold text-sm">8+ SYMBOLS WIN</div>
          </div>

          {/* Spin Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-center">
             <button 
               onClick={() => {
                 setAutoSpin(!autoSpin);
                 handleGenericClick();
               }}
               className={`
                 flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 transition-all
                 ${autoSpin ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'}
               `}
             >
                <RefreshCw size={20} className={autoSpin ? 'animate-spin' : ''} />
                <span className="text-[10px] font-bold uppercase mt-1">Auto</span>
             </button>

             <button 
               onClick={spin} 
               disabled={isSpinning || autoSpin}
               className="relative group w-24 h-24 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-700 border-4 border-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed transition-all"
             >
                <div className="absolute inset-2 rounded-full border-2 border-yellow-300/50"></div>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-red-900 uppercase tracking-wider group-hover:scale-110 transition-transform">
                  Spin
                </span>
             </button>
          </div>
        </div>
      </main>

      {/* Modals/Overlays */}
      <AgentPanel 
        isOpen={isAgentOpen} 
        onClose={() => {
            setIsAgentOpen(false);
            handleGenericClick();
        }} 
        onAddCredits={handleAddCredits}
        currentBalance={credits}
        soundEnabled={soundEnabled}
      />

      {/* Use a custom high win threshold or jackpot hit to show the big modal */}
      {(justWonJackpot || totalWin >= currentBet * 10) && (
        <WinNotification 
            amount={totalWin} 
            multiplier={totalWin / currentBet}
            isJackpot={justWonJackpot}
            onComplete={() => setTotalWin(0)} 
        />
      )}

      {/* Footer */}
      <footer className="p-4 text-center text-stone-600 text-xs relative z-10">
        Himalayan Fortune © 2024. Playing is addictive. Play responsibly.
      </footer>
    </div>
  );
}

export default App;