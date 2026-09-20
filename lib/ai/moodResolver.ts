// File: lib/ai/moodResolver.ts

export const resolveMoodToKeyword = (inputMood: string): string => {
  const cleanInput = inputMood.toLowerCase().trim();

  // KAMUS PENERJEMAH: Slang User -> Database Tag Standar
  const MOOD_DICTIONARY: Record<string, string> = {
    // --- EMOSI DASAR ---
    'galau': 'Sad',
    'sedih': 'Sad',
    'ambyar': 'Heartbroken', // Aura sekarang punya tag Heartbroken
    'nangis': 'Sad',
    'senang': 'Happy',
    'bahagia': 'Happy',
    'ceria': 'Cheerful', // Tag baru
    'marah': 'Angry',
    'emosi': 'Aggressive', // Tag baru untuk Phonk/Rock

    // --- EMOSI SPESIFIK (HASIL RE-TAGGING BARU) ---
    'jahat': 'Villainous',      // ID 656
    'nakal': 'Sassy',           // ID 42, 224
    'songong': 'Confident',     // ID 68
    'percaya diri': 'Confident',
    'goda': 'Seductive',        // ID 360
    'seksi': 'Seductive',
    'panas': 'Intense',
    'tegang': 'Tense',
    'seram': 'Eerie',
    'halu': 'Delusional',       // atau Dreamy
    'bingung': 'Confused',
    'nostalgia': 'Nostalgic',
    'kangen': 'Longing',

    // --- SITUASI ---
    'santai': 'Chill',
    'tenang': 'Calm',           // Aura banyak pakai Calm
    'rileks': 'Relaxed',
    'healing': 'Comforting',    // ID 420
    'tidur': 'Sleep',
    'belajar': 'Focus',
    'kerja': 'Focus',
    'pagi': 'Morning',
    'malam': 'Midnight',        // ID 384
    'gelap': 'Dark',            // ID 503
    'hujan': 'Rain',
    'bucin': 'Devoted',         // Tag baru untuk lagu romantis berat
    'kawin': 'Wedding',         // ID 146
    'nikah': 'Wedding',

    // --- GENRE SLANG & NICHE ---
    'jedagjedug': 'Electronic',
    'dugem': 'Club',
    'party': 'Party',
    'joget': 'Danceable',
    'semangat': 'High-Energy',  // Tag baru Nightcore
    'ngebut': 'Fast',           // Tag baru Nightcore
    
    // --- JEJEPANGAN & KOREA ---
    'wibu': 'J-Pop',
    'jejepangan': 'J-Pop',
    'anime': 'Anime',
    'vocaloid': 'Vocaloid',
    'miku': 'Vocaloid',
    'kpop': 'K-Pop',
    'korea': 'K-Pop',
    'oppa': 'K-Pop',

    // --- GENRE SPESIFIK BARU ---
    'rusuh': 'Chaotic',         // ID 474
    'aneh': 'Quirky',           // ID 39
    'unik': 'Quirky',
    'phonk': 'Phonk',           // Sekarang sudah ada!
    'brazil': 'Brazilian Funk', // Sekarang sudah ada!
    'funkot': 'Funk Carioca',
    'nightcore': 'Nightcore',   // Sekarang sudah ada!
    'laju': 'Speedcore',
    'keras': 'Metal',
    'berisik': 'Chaotic',
    'indo': 'Indonesian Pop',
    'lokal': 'Indonesian Pop',
    'barat': 'Pop',
  };

  return MOOD_DICTIONARY[cleanInput] || inputMood; // Kembalikan aslinya jika tidak ada di kamus (misal User ngetik "Jazz")
};