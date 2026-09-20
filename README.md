# 🎵 Stelify Music Player

> A modern, elegant, and intelligent Web Music Player crafted with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM**. Featuring lossless audio playback, an AI music companion (**Aura**), and a themed **Waifu Mode**.

---

## ✨ Features

### 🎧 High-Fidelity Audio Playback
- **Lossless & Hi-Res Audio Ready**: Supports FLAC (up to 24-bit / 192kHz), MP3, WAV, AAC, and M4A with native browser Web Audio and HTML5 audio decoding.
- **System Media Session Integration**: Full hardware media keys support (play, pause, next, prev, seek) and OS notification widget with album art.
- **Picture-in-Picture (PiP) Mode**: Custom canvas-rendered cover art and song title in a floating browser PiP window.

### 🤖 AI Companion Room (Aura)
- **Universal API Key Auto-Detection**: Enter API keys from **Google Gemini**, **Groq**, **OpenRouter**, or **OpenAI**. The system automatically probes the provider, detects available models (e.g. `gemini-2.0-flash`, `llama-3.3-70b-versatile`), and makes them immediately selectable.
- **Natural Language Library Control**: Ask Aura to find songs, create playlists, queue tracks, or set the atmosphere ("play something energetic", "I feel sad").
- **Dynamic Vibe & Atmosphere**: Interactive canvas background adapts to musical vibe (rain, fireflies, cosmic, cyberpunk, sakura).
- **Client-Side Key Privacy**: Custom API keys are stored locally in your browser's `localStorage` and sent directly to the local server endpoint.

### 🌸 Waifu Mode (Shinobu Aesthetic Player)
- **Interactive Anime Player**: Beautiful Shinobu Kocho-themed music interface with animated falling sakura petals and floating orbs.
- **Integrated Lyrics Tab**: Seamless tab switcher (`[Song Info]` $\leftrightarrow$ `[Lyrics]`) featuring a frosted-glass lyrics card with smooth auto-scroll to the singing line and click-to-seek.

### 🎤 Synchronized Karaoke Lyrics
- **.LRC Lyrics Parser**: Automatically detects and parses synchronized LRC timestamped lyrics.
- **Smooth Auto-Scroll**: Highlights the active line with smooth center scrolling without shifting the page layout.
- **Interactive Seek**: Click any lyric line to jump the playback directly to that timestamp.

### 📑 Playlists & Organization
- **Drag-and-Drop Ordering**: Reorder songs and playlists effortlessly using `@dnd-kit`.
- **Favorites & Play History**: Keep track of loved songs and listen history.
- **Metadata Auto-Extraction**: Automatically extracts ID3 tags, title, artist, album, and embedded cover art on upload (`music-metadata`, `jsmediatags`).

### 📱 Progressive Web App (PWA)
- Fully installable on Windows, macOS, Android, and iOS with offline shell caching via `@ducanh2912/next-pwa`.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Webpack) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs/) |
| **Database & ORM** | [Prisma 6](https://www.prisma.io/) with SQLite |
| **AI Integration** | [Google Generative AI](https://ai.google.dev/) & [OpenAI SDK](https://github.com/openai/openai-node) (Groq / OpenRouter) |
| **Drag & Drop** | [@dnd-kit/core](https://dndkit.com/) |
| **Metadata Parsing** | [music-metadata](https://github.com/Borewit/music-metadata) & [jsmediatags](https://github.com/aadsm/jsmediatags) |

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18.18+ or v20+
- npm, pnpm, or yarn

### 2. Clone Repository
```bash
git clone https://github.com/your-username/stelify-music-player.git
cd stelify-music-player
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your API keys (optional, you can also input them directly inside the AI Room UI):
```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your_gemini_api_key_here"
GROQ_API_KEY="your_groq_api_key_here"
```

### 5. Initialize Database
Initialize the SQLite database schema with Prisma:
```bash
npx prisma db push
```

### 6. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build

To create an optimized production build:
```bash
npm run build
npm run start
```

Or deploy using PM2 on a home server / VPS:
```bash
pm2 start npm --name "stelify-music" -- start
```

---

## 📁 Project Structure

```text
simple-music-player/
├── app/
│   ├── ai-room/          # AI Room page, Aura avatar, atmosphere, & APIKeyModal
│   ├── api/              # API routes (songs, playlists, upload, ai, models)
│   ├── components/       # GlobalPlayer, LyricsOverlay, LyricsView, Sidebar, etc.
│   ├── dashboard/        # Song list, search, and queue management
│   ├── favorites/        # Liked songs collection
│   ├── playlist/         # Playlist detail and song reordering
│   ├── upload/           # Audio & metadata upload page
│   ├── waifu/            # Waifu Shinobu aesthetic player mode
│   ├── globals.css       # Base CSS styling & typography
│   └── layout.tsx        # Root layout with Geist sans typography & stores
├── lib/
│   ├── ai/               # AI prompts, research services, & provider clients
│   └── prisma.ts         # Singleton Prisma client instance
├── prisma/
│   └── schema.prisma     # SQLite data models (Song, Playlist, History)
├── public/               # Static assets (placeholders, icons, manifests)
└── package.json
```

---

## 🔒 Privacy & Security

- **Audio & Media Files**: Audio files stored in `public/music/` and uploaded album art in `public/covers/` are ignored by Git (`.gitignore`) to keep the repository lightweight and private.
- **Local Database**: The local SQLite database (`dev.db`) is excluded from source control.
- **API Keys**: All server keys in `.env` and client keys configured in the UI are never tracked or exposed publicly.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
