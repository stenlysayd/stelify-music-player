"use client";

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const UploadForm = dynamic(() => import('./UploadForm'), { 
  ssr: false, 
  loading: () => (
    <div className="flex flex-col items-center w-full mt-8">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
        <div className="flex justify-center items-center mb-6 w-32 h-32 md:w-48 md:h-48 bg-zinc-800 rounded-lg mx-auto">
          <div className="w-10 h-10 border-4 border-zinc-700 border-t-green-500 rounded-full animate-spin"></div>
        </div>
        <div className="h-10 bg-zinc-800 rounded-md mb-3"></div>
      </div>
    </div>
  )
})

export default function UploadPage() {
  const router = useRouter();

  return (
    // PERBAIKAN UTAMA DISINI:
    // 1. 'fixed inset-0': Memastikan halaman ini mengisi 100% layar tanpa tergantung parent layout.
    // 2. 'h-screen' & 'overflow-y-auto': MEMAKSA scrollbar muncul di elemen ini (local scroll).
    // 3. 'z-40': Agar halaman ini tampil di atas background tapi di bawah Player (biasanya Player z-50).
    // 4. 'bg-black': Memastikan background hitam pekat.
    <div className="fixed inset-0 h-screen w-full bg-black text-white overflow-y-auto z-40">
      
      {/* WRAPPER KONTEN:
          Menambahkan padding bawah EXTRA BESAR (pb-48 / 12rem) agar konten paling bawah 
          bisa discroll naik melebihi tinggi Music Player. 
      */}
      <div className="w-full min-h-full p-4 md:p-8 pb-48 md:pb-[250px]">
        
        <div className="w-full max-w-4xl mx-auto mb-6 flex items-center">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition py-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali ke Player</span>
          </button>
        </div>
        
        <div className="w-full max-w-4xl mx-auto mb-6">
           <h1 className="text-2xl md:text-3xl font-bold">🎵 Upload Lagu Baru</h1>
        </div>

        <UploadForm />
      </div>
    </div>
  )
}