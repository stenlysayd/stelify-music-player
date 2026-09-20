import { motion, AnimatePresence } from 'framer-motion';

interface AtmosphereProps {
  mode: 'default' | 'rain' | 'sunset' | 'midnight' | 'focus';
}

const seededRandom = (seed: number, salt: number) => {
  const value = Math.sin(seed * 999 + salt * 101) * 10000;
  return value - Math.floor(value);
};

export const Atmosphere = ({ mode }: AtmosphereProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <AnimatePresence mode='wait'>
        
        {/* MODE: RAIN - Ultra realistic storm dengan wind effect */}
        {mode === 'rain' && (
          <motion.div
            key="rain"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {/* Deep stormy base dengan dynamic clouds */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-blue-950/40 to-slate-900/60" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/25 via-slate-900/30 to-blue-950/35" />
            
            {/* Animated storm clouds layer 1 */}
            <motion.div
              animate={{ 
                x: [-50, 50, -50],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-slate-800/20 via-slate-700/15 to-slate-800/20 blur-3xl"
            />
            
            {/* Animated storm clouds layer 2 - faster */}
            <motion.div
              animate={{ 
                x: [80, -80, 80],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-l from-blue-900/15 via-slate-800/10 to-blue-900/15 blur-[100px]"
            />
            
            {/* Heavy rain layer 1 - diagonal wind effect */}
            <div className="absolute inset-0 opacity-40">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-[2px] bg-gradient-to-b from-transparent via-cyan-200/80 to-transparent shadow-[0_0_6px_rgba(34,211,238,0.4)]"
                  style={{
                    left: `${seededRandom(i, 1) * 100}%`,
                    height: `${60 + seededRandom(i, 2) * 90}px`,
                    animation: `rainFallWind ${0.8 + seededRandom(i, 3) * 1.5}s linear infinite`,
                    animationDelay: `${seededRandom(i, 4) * 2}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Medium rain with blur */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-[1.5px] bg-gradient-to-b from-transparent via-blue-100/70 to-transparent blur-[0.5px]"
                  style={{
                    left: `${seededRandom(i, 5) * 100}%`,
                    height: `${70 + seededRandom(i, 6) * 100}px`,
                    animation: `rainFallWind ${1.2 + seededRandom(i, 7) * 2}s linear infinite`,
                    animationDelay: `${seededRandom(i, 8) * 3}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Distant rain mist */}
            <div className="absolute inset-0 opacity-15">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-px bg-gradient-to-b from-transparent via-slate-200/50 to-transparent blur-[1.5px]"
                  style={{
                    left: `${seededRandom(i, 9) * 100}%`,
                    height: `${50 + seededRandom(i, 10) * 80}px`,
                    animation: `rainFallWind ${1.8 + seededRandom(i, 11) * 2.5}s linear infinite`,
                    animationDelay: `${seededRandom(i, 12) * 4}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Dramatic lightning - multi-flash */}
            <motion.div
              animate={{ 
                opacity: [0, 0, 0, 0, 0.6, 0, 0.8, 0, 0.4, 0, 0],
                scale: [1, 1, 1, 1, 1.03, 1, 1.05, 1, 1.02, 1, 1]
              }}
              transition={{ 
                duration: 0.7,
                repeat: Infinity,
                repeatDelay: 7,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="absolute inset-0 bg-gradient-to-b from-blue-50/15 via-cyan-50/8 to-transparent"
            />
            
            {/* Thunder ambient glow */}
            <motion.div
              animate={{ 
                opacity: [0, 0, 0, 0.25, 0, 0.3, 0, 0.15, 0],
              }}
              transition={{ 
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 7.1,
              }}
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,197,253,0.2)_0%,transparent_60%)]"
            />
            
            {/* Lightning bolt effect */}
            <motion.div
              animate={{ 
                opacity: [0, 0, 0, 1, 0, 0.8, 0],
                scaleY: [0, 0, 0, 1, 0, 1, 0]
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 7.2,
                ease: "easeOut"
              }}
              className="absolute top-0 left-1/3 w-[3px] h-1/3 bg-gradient-to-b from-cyan-100 via-blue-200 to-transparent blur-sm"
              style={{ transformOrigin: 'top' }}
            />
            
            {/* Heavy fog layer dengan wave motion */}
            <motion.div
              animate={{ 
                x: [-100, 100, -100],
                opacity: [0.25, 0.45, 0.25]
              }}
              transition={{ 
                duration: 50,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-r from-slate-800/15 via-slate-700/20 to-slate-800/15 blur-[120px]"
            />
            
            {/* Ground mist rising */}
            <motion.div
              animate={{ 
                y: [20, -20, 20],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-slate-800/30 via-blue-900/15 to-transparent backdrop-blur-sm"
            />
            
            {/* Water surface ripples */}
            <div className="absolute bottom-0 inset-x-0 h-1/4">
              <motion.div
                animate={{ 
                  scaleX: [1, 1.02, 1],
                  opacity: [0.2, 0.35, 0.2]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-t from-cyan-800/25 via-blue-900/15 to-transparent"
              />
            </div>
            
            {/* Rain splash particles on ground */}
            <div className="absolute bottom-0 inset-x-0 h-20 opacity-40">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [0, 1.5, 0],
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{ 
                    duration: 0.5,
                    repeat: Infinity,
                    delay: seededRandom(i, 13) * 2,
                    ease: "easeOut"
                  }}
                  className="absolute w-2 h-2 border border-cyan-300/40 rounded-full"
                  style={{
                    left: `${seededRandom(i, 14) * 100}%`,
                    bottom: `${seededRandom(i, 15) * 20}px`,
                  }}
                />
              ))}
            </div>
            
            {/* Atmospheric water droplets */}
            <div className="absolute inset-0 opacity-35">
              {[...Array(25)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-cyan-200/50 rounded-full blur-[2px] shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                  style={{
                    left: `${seededRandom(i, 16) * 100}%`,
                    top: `${seededRandom(i, 17) * 100}%`,
                    animation: `floatRain ${8 + seededRandom(i, 18) * 10}s ease-in-out infinite`,
                    animationDelay: `${seededRandom(i, 19) * 8}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Wind streaks */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  x: [-200, 800],
                  opacity: [0, 0.3, 0]
                }}
                transition={{ 
                  duration: 3 + seededRandom(i, 20) * 2,
                  repeat: Infinity,
                  delay: seededRandom(i, 21) * 5,
                  ease: "easeIn"
                }}
                className="absolute top-0 left-0 w-40 h-[1px] bg-gradient-to-r from-transparent via-slate-300/20 to-transparent blur-sm"
                style={{
                  top: `${20 + seededRandom(i, 22) * 60}%`,
                }}
              />
            ))}
            
            {/* Storm vignette */}
            <div className="absolute inset-0 bg-black/65 mix-blend-multiply" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.5)_100%)]" />
          </motion.div>
        )}

        {/* MODE: SUNSET - Cinematic golden hour dengan dynamic sky */}
        {mode === 'sunset' && (
          <motion.div
            key="sunset"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {/* Rich sunset gradient base */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-950/80 via-rose-900/50 to-purple-950/40" />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/35 via-transparent to-pink-950/30" />
            <div className="absolute inset-0 bg-gradient-to-tl from-red-950/25 via-transparent to-violet-950/20" />
            
            {/* Animated sunset clouds */}
            <motion.div
              animate={{ 
                x: [0, 80, 0],
                opacity: [0.25, 0.4, 0.25]
              }}
              transition={{ duration: 60, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-rose-800/15 to-orange-900/20 blur-[100px]"
            />
            
            <motion.div
              animate={{ 
                x: [50, -50, 50],
                opacity: [0.2, 0.35, 0.2]
              }}
              transition={{ duration: 70, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-l from-pink-900/15 via-amber-900/10 to-pink-900/15 blur-[120px]"
            />
            
            {/* Giant sun with multiple halos */}
            <div className="absolute top-1/4 right-1/4 w-[800px] h-[800px]">
              {/* Outer halo */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.15, 0.25, 0.15]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-amber-400/15 to-transparent rounded-full blur-[180px]"
              />
              
              {/* Mid halo */}
              <motion.div
                animate={{ 
                  scale: [1, 1.08, 1],
                  opacity: [0.2, 0.35, 0.2]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-rose-400/25 via-pink-400/20 to-transparent rounded-full blur-[140px]"
              />
              
              {/* Inner glow */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.25, 0.4, 0.25]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-orange-400/25 to-transparent rounded-full blur-[100px]"
              />
            </div>
            
            {/* Bright sun core dengan shimmer */}
            <div className="absolute top-1/4 right-1/4 w-40 h-40 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.6, 0.4]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-br from-amber-200/40 to-orange-300/30 rounded-full blur-2xl"
              />
              <motion.div
                animate={{ 
                  rotate: [0, 180, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 via-transparent to-orange-400/20 rounded-full blur-xl"
              />
            </div>
            
            {/* Sun rays - dramatic beams */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0.15, 0.3, 0.15],
                  scaleX: [0.95, 1.05, 0.95]
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3
                }}
                className="absolute top-1/4 right-1/4 w-[1000px] h-[4px] bg-gradient-to-r from-transparent via-amber-300/25 to-transparent blur-md origin-left"
                style={{ 
                  transform: `rotate(${i * 45}deg)`,
                  transformOrigin: '0% 50%'
                }}
              />
            ))}
            
            {/* Enhanced golden particles dengan varied sizes */}
            <div className="absolute inset-0">
              {[...Array(35)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-gradient-to-br from-amber-300/50 via-orange-300/40 to-yellow-400/30 blur-sm shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                  style={{
                    left: `${10 + seededRandom(i, 23) * 80}%`,
                    top: `${15 + seededRandom(i, 24) * 65}%`,
                    width: `${3 + seededRandom(i, 25) * 8}px`,
                    height: `${3 + seededRandom(i, 26) * 8}px`,
                    animation: `floatSunset ${5 + seededRandom(i, 27) * 8}s ease-in-out infinite`,
                    animationDelay: `${seededRandom(i, 28) * 5}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Fireflies/embers effect */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{ 
                    duration: 3 + seededRandom(i, 29) * 2,
                    repeat: Infinity,
                    delay: seededRandom(i, 30) * 4,
                    ease: "easeInOut"
                  }}
                  className="absolute w-1.5 h-1.5 bg-amber-200/70 rounded-full blur-[1px] shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                  style={{
                    left: `${seededRandom(i, 31) * 100}%`,
                    top: `${seededRandom(i, 32) * 100}%`,
                  }}
                />
              ))}
            </div>
            
            {/* Golden dust particles */}
            <div className="absolute inset-0 opacity-50">
              {[...Array(25)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-amber-100/60 rounded-full blur-[1px]"
                  style={{
                    left: `${seededRandom(i, 33) * 100}%`,
                    top: `${seededRandom(i, 34) * 100}%`,
                    animation: `floatDust ${10 + seededRandom(i, 35) * 12}s ease-in-out infinite`,
                    animationDelay: `${seededRandom(i, 36) * 10}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Horizon color bands */}
            <div className="absolute bottom-0 inset-x-0 h-1/3">
              <div className="absolute inset-0 bg-gradient-to-t from-orange-900/50 via-rose-800/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-red-900/30 via-pink-900/20 to-transparent" />
              <motion.div
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-t from-amber-900/40 via-transparent to-transparent"
              />
            </div>
            
            {/* Atmospheric layers */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-900/12 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-900/10 via-transparent to-rose-900/10" />
            
            {/* Warm atmospheric haze */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-amber-950/25 backdrop-blur-[1px]" />
            
            {/* Enhanced rim lighting */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.2)_0%,transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(244,114,182,0.15)_0%,transparent_50%)]" />
            
            {/* Color overlay untuk richness */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/35 via-rose-900/25 to-purple-900/30 mix-blend-overlay" />
          </motion.div>
        )}

        {/* MODE: MIDNIGHT - Deep space cosmic atmosphere */}
        {mode === 'midnight' && (
          <motion.div
            key="midnight"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {/* Deep cosmic base dengan galaxy colors */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-indigo-950/80 to-slate-950/95" />
            <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-transparent to-blue-950/30" />
            <div className="absolute inset-0 bg-gradient-to-tl from-purple-950/25 via-transparent to-cyan-950/20" />
            
            {/* Animated cosmic clouds */}
            <motion.div
              animate={{ 
                x: [-30, 30, -30],
                y: [-10, 10, -10],
                opacity: [0.05, 0.12, 0.05]
              }}
              transition={{ duration: 80, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-indigo-900/8 to-purple-900/10 blur-[120px]"
            />
            
            {/* Galaxy dust */}
            <motion.div
              animate={{ 
                x: [20, -20, 20],
                opacity: [0.08, 0.15, 0.08],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 100, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-l from-blue-900/12 via-violet-900/10 to-blue-900/12 blur-[100px]"
            />
            
            {/* Enhanced starfield - tiny stars */}
            <div className="absolute inset-0">
              {[...Array(120)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-px h-px bg-white rounded-full shadow-[0_0_3px_rgba(255,255,255,0.9)]"
                  style={{
                    left: `${seededRandom(i, 37) * 100}%`,
                    top: `${seededRandom(i, 38) * 75}%`,
                    opacity: 0.3 + seededRandom(i, 39) * 0.6,
                    animation: `twinkle ${1.5 + seededRandom(i, 40) * 4}s ease-in-out infinite`,
                    animationDelay: `${seededRandom(i, 41) * 5}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Medium bright stars */}
            <div className="absolute inset-0">
              {[...Array(25)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-blue-50 rounded-full blur-[1px] shadow-[0_0_10px_rgba(191,219,254,0.7)]"
                  style={{
                    left: `${seededRandom(i, 42) * 100}%`,
                    top: `${seededRandom(i, 43) * 65}%`,
                    animation: `twinkleSlow ${3 + seededRandom(i, 44) * 6}s ease-in-out infinite`,
                    animationDelay: `${seededRandom(i, 45) * 6}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Bright prominent stars */}
            <div className="absolute inset-0">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.4, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{ 
                    duration: 4 + seededRandom(i, 46) * 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: seededRandom(i, 47) * 4
                  }}
                  className="absolute w-2 h-2 bg-cyan-100 rounded-full blur-[2px] shadow-[0_0_15px_rgba(224,242,254,0.8)]"
                  style={{
                    left: `${seededRandom(i, 48) * 100}%`,
                    top: `${seededRandom(i, 49) * 60}%`,
                  }}
                />
              ))}
            </div>
            
            {/* Star clusters with glow */}
            <div className="absolute inset-0">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0.15, 0.3, 0.15],
                    scale: [0.98, 1.02, 0.98]
                  }}
                  transition={{ 
                    duration: 10 + seededRandom(i, 50) * 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: seededRandom(i, 51) * 5
                  }}
                  className="absolute w-32 h-32 bg-gradient-to-br from-white/8 via-blue-100/5 to-transparent rounded-full blur-[60px]"
                  style={{
                    left: `${15 + seededRandom(i, 52) * 70}%`,
                    top: `${10 + seededRandom(i, 53) * 50}%`,
                  }}
                />
              ))}
            </div>
            
            {/* Giant moonlight dengan realistic glow */}
            <div className="absolute top-10 right-16 w-[600px] h-[600px]">
              <motion.div
                animate={{ 
                  scale: [1, 1.08, 1],
                  opacity: [0.1, 0.15, 0.1]
                }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-br from-blue-50/10 via-indigo-50/6 to-transparent rounded-full blur-[160px]"
              />
              
              <motion.div
                animate={{ 
                  scale: [1, 1.06, 1],
                  opacity: [0.12, 0.18, 0.12]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-cyan-50/8 via-blue-50/5 to-transparent rounded-full blur-[120px]"
              />
            </div>
            
            {/* Moon surface detail */}
            <div className="absolute top-12 right-20 w-24 h-24">
              <motion.div
                animate={{ 
                  opacity: [0.25, 0.35, 0.25]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-br from-blue-100/25 to-indigo-100/15 rounded-full blur-lg shadow-[0_0_60px_rgba(191,219,254,0.4)]"
              />
              
              {/* Moon craters */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bg-slate-800/30 rounded-full blur-sm"
                    style={{
                      left: `${20 + seededRandom(i, 54) * 60}%`,
                      top: `${20 + seededRandom(i, 55) * 60}%`,
                      width: `${4 + seededRandom(i, 56) * 8}px`,
                      height: `${4 + seededRandom(i, 57) * 8}px`,
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Enhanced nebula clouds */}
            <motion.div
              animate={{ 
                opacity: [0.08, 0.18, 0.08],
                scale: [1, 1.08, 1],
                rotate: [0, 3, 0],
                x: [-10, 10, -10]
              }}
              transition={{ 
                duration: 30,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/3 left-1/4 w-2/3 h-2/3 bg-gradient-to-br from-purple-900/12 via-blue-900/10 to-violet-900/8 rounded-full blur-[120px]"
            />
            
            <motion.div
              animate={{ 
                opacity: [0.1, 0.2, 0.1],
                scale: [1, 1.1, 1],
                rotate: [0, -4, 0],
                x: [10, -10, 10]
              }}
              transition={{ 
                duration: 35,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/2 right-1/3 w-1/2 h-1/2 bg-gradient-to-tl from-indigo-900/15 via-cyan-900/10 to-transparent rounded-full blur-[100px]"
            />
            
            {/* Milky Way effect */}
            <motion.div
              animate={{ 
                opacity: [0.06, 0.12, 0.06],
                rotate: [0, 2, 0]
              }}
              transition={{ 
                duration: 50,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 left-0 right-0 h-3/4 bg-gradient-to-b from-transparent via-slate-300/5 to-transparent blur-[80px]"
              style={{ transform: 'rotate(-15deg)' }}
            />
            
            {/* Cosmic dust particles */}
            <div className="absolute inset-0">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0, 0.4, 0],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{ 
                    duration: 5 + seededRandom(i, 58) * 5,
                    repeat: Infinity,
                    delay: seededRandom(i, 59) * 8,
                    ease: "easeInOut"
                  }}
                  className="absolute w-0.5 h-0.5 bg-blue-200/60 rounded-full blur-[1px]"
                  style={{
                    left: `${seededRandom(i, 60) * 100}%`,
                    top: `${seededRandom(i, 61) * 100}%`,
                  }}
                />
              ))}
            </div>
            
            {/* Enhanced aurora borealis */}
            <motion.div
              animate={{ 
                opacity: [0.06, 0.18, 0.06],
                scaleY: [1, 1.15, 1],
                x: [-30, 30, -30]
              }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 left-1/4 w-3/4 h-2/5 bg-gradient-to-b from-emerald-500/10 via-cyan-500/6 to-transparent blur-[100px]"
            />
            
            <motion.div
              animate={{ 
                opacity: [0.08, 0.2, 0.08],
                scaleY: [1, 1.2, 1],
                x: [30, -30, 30]
              }}
              transition={{ 
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3
              }}
              className="absolute top-0 right-1/4 w-2/3 h-2/5 bg-gradient-to-b from-teal-500/8 via-blue-500/5 to-transparent blur-[90px]"
            />
            
            {/* Aurora waves */}
            <motion.div
              animate={{ 
                opacity: [0.1, 0.25, 0.1],
                scaleX: [1, 1.1, 1],
                y: [0, -20, 0]
              }}
              transition={{ 
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-10 inset-x-0 h-1/4 bg-gradient-to-b from-violet-500/6 via-purple-500/4 to-transparent blur-[70px]"
            />
            
            {/* Deep space fog */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-transparent to-slate-950/70 backdrop-blur-[2px]" />
            
            {/* Shooting stars - multiple */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  x: [-150, 600],
                  y: [-50, 400],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{ 
                  duration: 1.5 + seededRandom(i, 62) * 0.5,
                  repeat: Infinity,
                  repeatDelay: 12 + seededRandom(i, 63) * 8,
                  ease: "easeIn",
                  delay: i * 4
                }}
                className="absolute w-24 h-[2px] bg-gradient-to-r from-transparent via-white/90 to-transparent blur-[1px] shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                style={{
                  top: `${10 + seededRandom(i, 64) * 40}%`,
                  left: `${10 + seededRandom(i, 65) * 30}%`,
                }}
              />
            ))}
            
            {/* Meteor trail effect */}
            <motion.div
              animate={{ 
                x: [-200, 800],
                y: [0, 500],
                opacity: [0, 0.8, 0]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 20,
                ease: "easeIn"
              }}
              className="absolute top-1/3 left-0 w-40 h-1 bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent blur-sm"
            />
            
            {/* Distant planets/satellites */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 8 + seededRandom(i, 66) * 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: seededRandom(i, 67) * 5
                }}
                className="absolute bg-gradient-to-br from-slate-400/20 to-slate-600/15 rounded-full blur-md"
                style={{
                  left: `${20 + seededRandom(i, 68) * 60}%`,
                  top: `${15 + seededRandom(i, 69) * 40}%`,
                  width: `${6 + seededRandom(i, 70) * 8}px`,
                  height: `${6 + seededRandom(i, 71) * 8}px`,
                }}
              />
            ))}
            
            {/* Constellation lines (subtle) */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0.05, 0.15, 0.05]
                }}
                transition={{ 
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 2
                }}
                className="absolute w-20 h-[1px] bg-gradient-to-r from-transparent via-blue-200/20 to-transparent blur-[0.5px]"
                style={{
                  left: `${20 + seededRandom(i, 72) * 60}%`,
                  top: `${20 + seededRandom(i, 73) * 40}%`,
                  transform: `rotate(${seededRandom(i, 74) * 360}deg)`
                }}
              />
            ))}
            
            {/* Deep vignette */}
            <div className="absolute inset-0 bg-black/80 mix-blend-multiply" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(0,0,0,0.6)_100%)]" />
          </motion.div>
        )}

        {/* MODE: FOCUS - Ultra clean zen dengan premium feel */}
        {mode === 'focus' && (
          <motion.div
            key="focus"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {/* Premium clean base */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/10 via-blue-50/6 to-indigo-50/10" />
            <div className="absolute inset-0 bg-gradient-to-tl from-white/6 via-transparent to-cyan-50/6" />
            
            {/* Animated subtle waves */}
            <motion.div
              animate={{ 
                x: [-20, 20, -20],
                opacity: [0.04, 0.08, 0.04]
              }}
              transition={{ 
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-blue-100/5 via-indigo-100/3 to-blue-100/5 blur-[100px]"
            />
            
            {/* Premium grid with glow */}
            <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:100px_100px] animate-[gridMove_30s_linear_infinite]" />
            
            {/* Central spotlight layers */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.15, 0.22, 0.15]
              }}
              transition={{ 
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,transparent_65%)]"
            />
            
            <motion.div
              animate={{ 
                scale: [1, 1.08, 1],
                opacity: [0.08, 0.15, 0.08]
              }}
              transition={{ 
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)]"
            />
            
            {/* Pulsing rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0.03, 0.1, 0.03],
                  scale: [0.95, 1.05, 0.95]
                }}
                transition={{ 
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 2
                }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(255,255,255,0.05)_50%,transparent_70%)]"
              />
            ))}
            
            {/* Premium floating particles - varied sizes */}
            <div className="absolute inset-0">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -30, 0],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{ 
                    duration: 8 + seededRandom(i, 75) * 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: seededRandom(i, 76) * 6
                  }}
                  className="absolute rounded-full bg-white/20 backdrop-blur-sm shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                  style={{
                    left: `${10 + seededRandom(i, 77) * 80}%`,
                    top: `${20 + seededRandom(i, 78) * 60}%`,
                    width: `${3 + seededRandom(i, 79) * 8}px`,
                    height: `${3 + seededRandom(i, 80) * 8}px`,
                  }}
                />
              ))}
            </div>
            
            {/* Zen micro particles */}
            <div className="absolute inset-0">
              {[...Array(25)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    x: [0, 15, 0],
                    y: [0, -20, 0],
                    opacity: [0.2, 0.5, 0.2]
                  }}
                  transition={{ 
                    duration: 10 + seededRandom(i, 81) * 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: seededRandom(i, 82) * 8
                  }}
                  className="absolute w-1 h-1 bg-blue-100/40 rounded-full blur-[1px]"
                  style={{
                    left: `${seededRandom(i, 83) * 100}%`,
                    top: `${seededRandom(i, 84) * 100}%`,
                  }}
                />
              ))}
            </div>
            
            {/* Light rays from corners */}
            <motion.div
              animate={{ 
                opacity: [0.06, 0.12, 0.06]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-blue-50/12 via-blue-50/6 to-transparent blur-[80px]"
            />
            
            <motion.div
              animate={{ 
                opacity: [0.08, 0.15, 0.08]
              }}
              transition={{ 
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-indigo-50/12 via-indigo-50/6 to-transparent blur-[80px]"
            />
            
            {/* Zen circles - multiple layers */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0.04, 0.12, 0.04],
                  scale: [0.96, 1.02, 0.96]
                }}
                transition={{ 
                  duration: 10 + i * 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 2
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8 blur-[2px]"
                style={{
                  width: `${400 + i * 150}px`,
                  height: `${400 + i * 150}px`,
                }}
              />
            ))}
            
            {/* Side accent glows */}
            <motion.div
              animate={{ 
                opacity: [0.08, 0.15, 0.08],
                scaleY: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/4 left-0 w-[2px] h-1/2 bg-gradient-to-b from-transparent via-white/12 to-transparent blur-[2px]"
            />
            
            <motion.div
              animate={{ 
                opacity: [0.08, 0.15, 0.08],
                scaleY: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-1/4 right-0 w-[2px] h-1/2 bg-gradient-to-b from-transparent via-white/12 to-transparent blur-[2px]"
            />
            
            {/* Horizontal zen lines */}
            <motion.div
              animate={{ 
                opacity: [0.05, 0.12, 0.05],
                scaleX: [0.98, 1.02, 0.98]
              }}
              transition={{ 
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/3 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent blur-[1px]"
            />
            
            <motion.div
              animate={{ 
                opacity: [0.05, 0.12, 0.05],
                scaleX: [0.98, 1.02, 0.98]
              }}
              transition={{ 
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute bottom-1/3 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent blur-[1px]"
            />
            
            {/* Premium clarity vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.15)_100%)]" />
            
            {/* Gentle overlay */}
            <div className="absolute inset-0 bg-white/[0.04] mix-blend-overlay" />
            
            {/* Enhanced breathing pulse */}
            <motion.div
              animate={{ 
                opacity: [0.03, 0.1, 0.03],
                scale: [0.99, 1.01, 0.99]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent"
            />
            
            {/* Ambient light drift */}
            <motion.div
              animate={{ 
                x: [-50, 50, -50],
                y: [-30, 30, -30],
                opacity: [0.05, 0.1, 0.05]
              }}
              transition={{ 
                duration: 40,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-100/8 via-white/5 to-indigo-100/8 rounded-full blur-[150px]"
            />
          </motion.div>
        )}

      </AnimatePresence>

      <style jsx>{`
        @keyframes rainFallWind {
          0% { transform: translateY(-100vh) translateX(0); opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { transform: translateY(100vh) translateX(30px); opacity: 0; }
        }
        
        @keyframes rainFall {
          0% { transform: translateY(-100vh) translateX(0); opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { transform: translateY(100vh) translateX(20px); opacity: 0; }
        }
        
        @keyframes floatRain {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(-20px, -30px) scale(1.2); opacity: 0.6; }
          50% { transform: translate(10px, -60px) scale(0.9); opacity: 0.4; }
          75% { transform: translate(-15px, -40px) scale(1.1); opacity: 0.5; }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.3); }
        }
        
        @keyframes twinkleSlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes floatSunset {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          25% { transform: translate(25px, -35px) scale(1.3); opacity: 0.7; }
          50% { transform: translate(-20px, -70px) scale(0.85); opacity: 0.5; }
          75% { transform: translate(30px, -45px) scale(1.15); opacity: 0.6; }
        }
        
        @keyframes floatDust {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.3; }
          33% { transform: translate(40px, -20px) rotate(120deg); opacity: 0.6; }
          66% { transform: translate(-30px, -40px) rotate(240deg); opacity: 0.4; }
        }
        
        @keyframes floatFocus {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          33% { transform: translate(35px, -25px) scale(1.15); opacity: 0.7; }
          66% { transform: translate(-25px, -45px) scale(0.95); opacity: 0.4; }
        }
        
        @keyframes floatZen {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(20px, -30px) scale(1.1); opacity: 0.6; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(100px, 100px); }
        }
      `}</style>
    </div>
  );
};

