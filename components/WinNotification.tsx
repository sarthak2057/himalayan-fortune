import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface WinNotificationProps {
  amount: number;
  multiplier?: number;
  isJackpot?: boolean;
  onComplete: () => void;
}

export const WinNotification: React.FC<WinNotificationProps> = ({ amount, multiplier, isJackpot, onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500); // Wait for exit anim
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-40 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-yellow-500 blur-[60px] opacity-20 rounded-full animate-pulse"></div>
        <div className="bg-gradient-to-r from-red-900 via-red-700 to-red-900 border-4 border-yellow-400 p-8 rounded-2xl shadow-2xl transform scale-110 animate-bounce text-center min-w-[300px] relative">
           
           {/* Multiplier Badge for Big Wins (or Jackpot) */}
           {multiplier && multiplier > 1 && (
             <div className="absolute -top-6 -right-6 bg-yellow-500 text-red-900 text-xl font-black px-4 py-2 rounded-full border-4 border-white shadow-lg rotate-12 animate-pulse z-50">
               {multiplier.toFixed(1).replace(/\.0$/, '')}x
             </div>
           )}

           <h2 className={`text-4xl md:text-5xl font-black mb-2 drop-shadow-md nepali-title ${
             isJackpot 
               ? 'text-gradient-gold scale-110' 
               : 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600'
           }`}>
             {isJackpot ? 'JACKPOT!' : 'MEGA WIN!'}
           </h2>
           <div className="flex justify-center items-center space-x-2 text-white text-3xl font-bold">
             <Sparkles className="text-yellow-300 animate-spin" />
             <span>{amount.toFixed(2)}</span>
             <Sparkles className="text-yellow-300 animate-spin" />
           </div>
        </div>
      </div>
    </div>
  );
};