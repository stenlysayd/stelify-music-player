import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal } from 'lucide-react';

interface ChatPanelProps {
  messages: { sender: 'user' | 'ai'; text: string }[];
  onSend: (msg: string) => void;
  isAfk: boolean;
  isThinking: boolean;
  trackTyping?: () => void; 
}

// SESUDAH (SOLUSI):
const formatMessage = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g); // Update regex support code block juga
  
  return (
    // Tambahkan div pembungkus dengan whitespace-pre-wrap
    <div className="whitespace-pre-wrap break-words"> 
      {parts.map((part, index) => {
        // Bold (**text**)
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-bold text-indigo-100">
              {part.slice(2, -2)}
            </strong>
          );
        }
        // Code Block (`text`) - Opsional biar ID makin jelas
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={index} className="bg-indigo-900/50 px-1 py-0.5 rounded text-indigo-200 font-mono text-xs">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

export const ChatPanel = ({ messages, onSend, isAfk, isThinking, trackTyping }: ChatPanelProps) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isThinking) {
      onSend(input);
      setInput('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (trackTyping) trackTyping(); 
  };

  const canSend = input.trim().length > 0 && !isThinking;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: isAfk ? 0 : 1, x: isAfk ? 100 : 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="absolute bottom-24 md:bottom-28 right-4 left-4 md:left-auto md:right-6 md:w-[440px] lg:w-[380px] z-50 pointer-events-none flex flex-col justify-end"
    >
      {/* Chat messages area - Open Style */}
      <div 
        ref={scrollRef}
        className="w-full max-h-[440px] md:max-h-[400px] overflow-y-auto p-5 md:p-6 space-y-4 pointer-events-auto scrollbar-thin scrollbar-thumb-indigo-500/40 scrollbar-track-transparent mb-4"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`relative max-w-[88%] px-4 py-3.5 text-sm shadow-lg leading-relaxed group transition-all duration-300 ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600 via-indigo-600/95 to-indigo-700 text-white rounded-[20px] rounded-tr-md shadow-[0_4px_16px_rgba(99,102,241,0.3)] border border-indigo-400/30 backdrop-blur-sm hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)]' 
                  : 'bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-900/80 text-gray-100 border border-indigo-400/15 rounded-[20px] rounded-tl-md backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)] hover:border-indigo-400/25'
              }`}
              >
                {/* Enhanced shine effect */}
                <div className={`absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-br from-white/15 via-white/5 to-transparent' 
                    : 'bg-gradient-to-br from-indigo-400/8 via-indigo-300/4 to-transparent'
                }`} />
                
                {/* Subtle inner glow */}
                <div className={`absolute inset-0 rounded-[20px] ${
                  msg.sender === 'user'
                    ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                    : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                }`} />
                
                <div className="relative z-10">
                  {formatMessage(msg.text)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isThinking && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 ml-2"
          >
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1s_ease-in-out_infinite_0ms] shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-[bounce_1s_ease-in-out_infinite_150ms] shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-[bounce_1s_ease-in-out_infinite_300ms] shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            </div>
            <span className="text-xs text-indigo-300/70 font-medium tracking-wide">
              Sedang Berpikir...
            </span>
          </motion.div>
        )}
      </div>

      {/* Input form - Open floating style */}
      <div className="w-full pointer-events-auto">
        <div className="relative group">
          {/* Ambient glow on focus */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-cyan-500/0 opacity-0 group-focus-within:opacity-30 transition-opacity duration-500 pointer-events-none blur-lg" />
          
          <form onSubmit={handleSubmit} className="relative bg-gradient-to-br from-slate-900/95 via-indigo-950/90 to-slate-900/95 backdrop-blur-3xl rounded-full border border-indigo-500/25 shadow-[0_8px_40px_rgba(99,102,241,0.2),0_0_100px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] p-2 flex gap-2 items-center pl-4 transition-all duration-300">
            
            {/* Enhanced ambient glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/5 pointer-events-none rounded-full" />
            
            {/* Animated grain texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] animate-[grain_8s_steps(10)_infinite] pointer-events-none rounded-full" />
            
            {/* Top subtle shimmer */}
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-full overflow-hidden opacity-50">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_3s_ease-in-out_infinite] w-1/3" />
            </div>
            
            <input
              type="text"
              value={input}
              onChange={handleChange}
              placeholder="Tulis Pesanmu..."
              disabled={isThinking}
              className="relative flex-1 bg-transparent text-white placeholder-indigo-300/40 outline-none text-sm md:text-base z-10"
            />
            
            <button 
              type="submit"
              disabled={!canSend}
              aria-label="Kirim pesan"
              className="relative bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white p-3 rounded-full transition-all duration-300 shadow-[0_4px_16px_rgba(99,102,241,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.6)] active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:shadow-[0_4px_16px_rgba(99,102,241,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] z-10"
            >
              <SendHorizontal className="w-5 h-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes bounce {
          0%, 100% { 
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% { 
            transform: translateY(-8px) scale(1.1);
            opacity: 0.8;
          }
        }
        
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.6);
        }
      `}</style>
    </motion.div>
  );
};
