
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User, Bot, Coins } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToAgent } from '../services/geminiService';
import { playClick } from '../audioUtils';

interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCredits: (amount: number) => void;
  currentBalance: number;
  soundEnabled: boolean;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ isOpen, onClose, onAddCredits, currentBalance, soundEnabled }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'agent',
      text: 'Namaste! I am Dai, your agent. Need some credits to play?',
      timestamp: Date.now(),
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const playSound = () => {
    if (soundEnabled) playClick();
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    playSound();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const response = await sendMessageToAgent(userMsg.text, currentBalance);

    if (response.creditsAdded && response.creditsAdded > 0) {
      onAddCredits(response.creditsAdded);
    }

    const agentMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'agent',
      text: response.text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, agentMsg]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border-2 border-yellow-600 rounded-xl w-full max-w-md h-[600px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-900 p-4 flex justify-between items-center border-b border-yellow-600">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-full text-red-900">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-bold text-yellow-100 nepali-title text-lg">Agent Dai</h3>
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-yellow-200 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-stone-900 to-stone-800">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-red-700 text-white rounded-tr-none'
                    : 'bg-stone-700 text-yellow-50 rounded-tl-none border border-stone-600'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-stone-700 p-3 rounded-lg rounded-tl-none border border-stone-600 flex space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-stone-900 border-t border-stone-700">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for credits (e.g., 'Give me 1000')"
              className="flex-1 bg-stone-800 text-white border border-stone-600 rounded-full px-4 py-3 focus:outline-none focus:border-yellow-500 transition"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-yellow-600 hover:bg-yellow-500 text-stone-900 p-3 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-stone-500 text-xs mt-2">
            Powered by Gemini 2.5 Flash
          </p>
        </div>
      </div>
    </div>
  );
};
