import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AuraExpression } from './useAICompanion';

interface AvatarProps {
  expression: AuraExpression;
  isTalking: boolean; 
}

export const Avatar = ({ expression, isTalking }: AvatarProps) => {
  
  const images: Record<AuraExpression, string> = {
    idle: '/aura/idle.png',
    happy: '/aura/happy.png',
    shy: '/aura/shy.png',
    working: '/aura/working.png',
    confused: '/aura/confused.png',
  };

  return (
    <div className="absolute bottom-0 left-0 w-full h-screen pointer-events-none z-0 overflow-hidden">
        
        {/* Enhanced ambient light rays dengan multiple layers */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-25">
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/40 via-purple-600/25 to-transparent blur-[120px] animate-[pulse_4s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/30 via-blue-500/15 to-transparent blur-[100px] animate-[pulse_5s_ease-in-out_infinite_1s]" />
            <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 via-purple-500/10 to-transparent blur-[140px] animate-[pulse_6s_ease-in-out_infinite_2s]" />
        </div>

        {/* Enhanced floating particles dengan lebih banyak variasi */}
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute bottom-[20%] left-[15%] w-2.5 h-2.5 bg-indigo-400/50 rounded-full blur-[2px] animate-[floatParticle1_12s_ease-in-out_infinite]" />
            <div className="absolute bottom-[40%] left-[25%] w-2 h-2 bg-purple-400/40 rounded-full blur-[1px] animate-[floatParticle2_15s_ease-in-out_infinite_2s]" />
            <div className="absolute bottom-[60%] left-[35%] w-1.5 h-1.5 bg-cyan-400/35 rounded-full blur-[1px] animate-[floatParticle3_18s_ease-in-out_infinite_4s]" />
            <div className="absolute bottom-[30%] left-[10%] w-2 h-2 bg-pink-400/30 rounded-full blur-[2px] animate-[floatParticle1_20s_ease-in-out_infinite_6s]" />
            <div className="absolute bottom-[50%] left-[45%] w-1 h-1 bg-blue-400/40 rounded-full blur-[1px] animate-[floatParticle2_14s_ease-in-out_infinite_3s]" />
            <div className="absolute bottom-[70%] left-[20%] w-1.5 h-1.5 bg-violet-400/35 rounded-full blur-[2px] animate-[floatParticle3_16s_ease-in-out_infinite_5s]" />
        </div>

        {/* Main avatar container */}
        <div className="w-full h-screen absolute bottom-0 flex items-end justify-center">
            
            {/* Enhanced multi-layered aura glow dengan lebih banyak depth */}
            <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px]">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/35 via-indigo-500/25 to-transparent blur-[140px] rounded-full mix-blend-screen animate-[pulse_6s_ease-in-out_infinite]" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 via-purple-500/20 to-transparent blur-[120px] rounded-full mix-blend-screen animate-[pulse_7s_ease-in-out_infinite_1s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/25 via-cyan-400/15 to-transparent blur-[100px] rounded-full mix-blend-screen animate-[pulse_8s_ease-in-out_infinite_2s]" />
            </div>

            {/* Image container dengan improved scaling */}
            <div className="relative w-full max-w-[90vw] md:max-w-[70vw] lg:max-w-[60vw] h-[92vh] md:h-[95vh]">
                 {/* Enhanced backdrop shadow dengan gradient yang lebih soft */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent blur-3xl scale-110 opacity-80" />

                 <AnimatePresence mode='wait'>
                    <motion.div
                        key={expression}
                        initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            filter: 'blur(0px)',
                            y: [0, -10, 0]
                        }}
                        exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
                        transition={{ 
                            opacity: { duration: 0.6, ease: "easeOut" },
                            scale: { duration: 0.6, ease: "easeOut" },
                            filter: { duration: 0.5 },
                            y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="relative w-full h-full"
                    >
                        <Image
                            src={images[expression]}
                            alt={`Aura ${expression}`}
                            fill
                            className="object-contain object-bottom drop-shadow-[0_0_80px_rgba(99,102,241,0.4)] scale-[1.35] sm:scale-[1.25] md:scale-[1.15] lg:scale-[1.1] origin-bottom"
                            priority
                            sizes="(max-width: 640px) 90vw, (max-width: 768px) 80vw, (max-width: 1024px) 70vw, 60vw"
                        />
                    </motion.div>
                 </AnimatePresence>

                 {/* Enhanced scanline dengan smoother animation */}
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent h-full animate-[scanLine_10s_ease-in-out_infinite] pointer-events-none" />
                 
                 {/* Enhanced hologram overlay dengan lebih subtle effect */}
                 <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.04] via-transparent to-pink-500/[0.04] mix-blend-screen animate-[shimmer_12s_ease-in-out_infinite] pointer-events-none opacity-50" />
                 
                 {/* Additional chromatic aberration effect */}
                 <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] via-transparent to-blue-500/[0.02] mix-blend-screen animate-[pulse_4s_ease-in-out_infinite] pointer-events-none" />
            </div>
        </div>

        {/* Enhanced vertical light streaks dengan lebih banyak variasi */}
        <div className="absolute bottom-0 left-[18%] w-px h-[35%] bg-gradient-to-t from-indigo-500/25 via-indigo-400/15 to-transparent animate-[fadeInOut_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-[30%] w-px h-[50%] bg-gradient-to-t from-purple-500/20 via-purple-400/10 to-transparent animate-[fadeInOut_8s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-0 left-[42%] w-px h-[42%] bg-gradient-to-t from-cyan-500/18 via-cyan-400/10 to-transparent animate-[fadeInOut_7s_ease-in-out_infinite_1s]" />

        {/* Diagonal light rays untuk depth yang lebih baik */}
        <div className="absolute bottom-0 left-[25%] w-[1px] h-[60%] bg-gradient-to-t from-indigo-400/15 to-transparent rotate-12 origin-bottom animate-[fadeInOut_9s_ease-in-out_infinite_3s]" />
        <div className="absolute bottom-0 right-[25%] w-[1px] h-[55%] bg-gradient-to-t from-purple-400/12 to-transparent -rotate-12 origin-bottom animate-[fadeInOut_10s_ease-in-out_infinite_4s]" />

        <style jsx>{`
            @keyframes floatParticle1 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
                25% { transform: translate(35px, -70px) scale(1.3); opacity: 0.7; }
                50% { transform: translate(-25px, -140px) scale(0.9); opacity: 0.4; }
                75% { transform: translate(45px, -90px) scale(1.15); opacity: 0.6; }
            }
            @keyframes floatParticle2 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                33% { transform: translate(-45px, -80px) scale(1.4); opacity: 0.6; }
                66% { transform: translate(30px, -160px) scale(0.95); opacity: 0.3; }
            }
            @keyframes floatParticle3 {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.45; }
                40% { transform: translate(40px, -100px) scale(1.2); opacity: 0.7; }
                80% { transform: translate(-35px, -180px) scale(0.88); opacity: 0.35; }
            }
            @keyframes scanLine {
                0% { transform: translateY(-100%); opacity: 0; }
                5% { opacity: 1; }
                95% { opacity: 1; }
                100% { transform: translateY(100%); opacity: 0; }
            }
            @keyframes shimmer {
                0% { transform: translateX(-100%) skewX(-10deg); }
                100% { transform: translateX(100%) skewX(-10deg); }
            }
            @keyframes fadeInOut {
                0%, 100% { opacity: 0; transform: scaleY(0.95); }
                50% { opacity: 1; transform: scaleY(1); }
            }
            @keyframes pulse {
                0%, 100% { opacity: 0.25; transform: scale(1); }
                50% { opacity: 0.35; transform: scale(1.08); }
            }
        `}</style>
    </div>
  );
};