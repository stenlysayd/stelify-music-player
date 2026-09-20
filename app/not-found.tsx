// app/not-found.tsx
import Link from 'next/link'
export const dynamic = 'force-dynamic';
export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-4xl font-bold mb-4">404 - Not Found</h2>
      <p className="text-zinc-400 mb-8">Halaman yang Anda cari tidak ditemukan.</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition"
      >
        Kembali ke Home
      </Link>
    </div>
  )
}