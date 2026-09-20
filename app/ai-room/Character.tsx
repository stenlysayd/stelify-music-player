import { motion } from 'framer-motion';
import { usePlayerStore } from '@/app/hooks/usePlayerStore';

export const Character = ({ isAfk }: { isAfk: boolean }) => {
    const currentSongId = usePlayerStore((state) => state.currentSong?.id);

    return (
        <div className="absolute bottom-0 left-0 w-full md:w-[50vw] h-full pointer-events-none z-0 overflow-hidden">
            
            {/* Ambient light rays */}
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] opacity-20">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/30 via-purple-600/20 to-transparent blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-blue-500/10 to-transparent blur-3xl animate-[pulse_5s_ease-in-out_infinite_1s]" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute bottom-[20%] left-[15%] w-2 h-2 bg-indigo-400/40 rounded-full blur-[2px] animate-[floatParticle1_12s_ease-in-out_infinite]" />
                <div className="absolute bottom-[40%] left-[25%] w-1.5 h-1.5 bg-purple-400/30 rounded-full blur-[1px] animate-[floatParticle2_15s_ease-in-out_infinite_2s]" />
                <div className="absolute bottom-[60%] left-[35%] w-1 h-1 bg-cyan-400/25 rounded-full blur-[1px] animate-[floatParticle3_18s_ease-in-out_infinite_4s]" />
                <div className="absolute bottom-[30%] left-[10%] w-1.5 h-1.5 bg-pink-400/20 rounded-full blur-[2px] animate-[floatParticle1_20s_ease-in-out_infinite_6s]" />
            </div>

            <motion.div
                key={currentSongId ?? 'idle'}
                initial={{ scale: 0.95 }}
                animate={{
                    y: [0, -12, 0],
                    rotate: [0, 1, -1, 0],
                    scale: isAfk ? 0.98 : [1.02, 1],
                    filter: isAfk ? 'grayscale(40%) brightness(80%)' : 'grayscale(0%) brightness(100%)',
                }}
                transition={{
                    y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 0.5, ease: "backOut" },
                    filter: { duration: 1 }
                }}
                className="w-full h-[85vh] absolute bottom-0 flex items-end justify-center md:justify-start md:pl-10"
            >
                {/* Multi-layered aura glow */}
                <div className="absolute bottom-1/2 left-1/4 w-[600px] h-[600px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/30 via-indigo-500/20 to-transparent blur-[120px] rounded-full mix-blend-screen animate-[pulse_6s_ease-in-out_infinite]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-600/25 via-purple-500/15 to-transparent blur-[100px] rounded-full mix-blend-screen animate-[pulse_7s_ease-in-out_infinite_1s]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-cyan-400/10 to-transparent blur-[80px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite_2s]" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-gradient-to-b from-white/10 to-transparent blur-[60px] rounded-full opacity-30" />
                </div>

                {/* Character container */}
                <div className="relative w-full h-[110%] mt-[-5%]">
                    {/* Backdrop shadow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent blur-2xl scale-110 opacity-70" />
                    
                    {/* Edge highlight */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10 mix-blend-screen" />
                    
                    {/* Character image */}
                    <img
                        src="/1392858.png" 
                        alt="AI Companion"
                        className="relative w-full h-full object-cover object-[center_top] scale-[1.05] origin-top drop-shadow-[0_0_60px_rgba(99,102,241,0.3)] transition-all duration-1000"
                        style={{ 
                            maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
                            filter: isAfk 
                                ? 'drop-shadow(0 0 40px rgba(99,102,241,0.2))' 
                                : 'drop-shadow(0 0 80px rgba(99,102,241,0.4)) drop-shadow(0 0 120px rgba(139,92,246,0.3))'
                        }} 
                    />
                    
                    {/* Scanline effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent h-full animate-[scanLine_8s_ease-in-out_infinite] pointer-events-none" />
                    
                    {/* Holographic shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.03] via-transparent to-pink-500/[0.03] mix-blend-screen animate-[shimmer_10s_ease-in-out_infinite] pointer-events-none opacity-40" />
                </div>
            </motion.div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
            
            {/* Vertical light streaks */}
            <div className="absolute bottom-0 left-[20%] w-px h-[40%] bg-gradient-to-t from-indigo-500/20 to-transparent animate-[fadeInOut_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 left-[35%] w-px h-[55%] bg-gradient-to-t from-purple-500/15 to-transparent animate-[fadeInOut_8s_ease-in-out_infinite_2s]" />
            <div className="absolute bottom-0 left-[28%] w-px h-[48%] bg-gradient-to-t from-cyan-500/10 to-transparent animate-[fadeInOut_7s_ease-in-out_infinite_4s]" />

            <style jsx>{`
                @keyframes floatParticle1 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                    25% { transform: translate(30px, -60px) scale(1.2); opacity: 0.6; }
                    50% { transform: translate(-20px, -120px) scale(0.8); opacity: 0.3; }
                    75% { transform: translate(40px, -80px) scale(1.1); opacity: 0.5; }
                }
                
                @keyframes floatParticle2 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                    33% { transform: translate(-40px, -70px) scale(1.3); opacity: 0.5; }
                    66% { transform: translate(25px, -140px) scale(0.9); opacity: 0.2; }
                }
                
                @keyframes floatParticle3 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.35; }
                    40% { transform: translate(35px, -90px) scale(1.1); opacity: 0.6; }
                    80% { transform: translate(-30px, -160px) scale(0.85); opacity: 0.25; }
                }
                
                @keyframes scanLine {
                    0% { transform: translateY(-100%); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(100%); opacity: 0; }
                }
                
                @keyframes shimmer {
                    0%, 100% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                }
                
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};
