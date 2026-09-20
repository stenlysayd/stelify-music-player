"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Terjadi Kesalahan!</h2>
      <p className="text-zinc-400 mb-6 text-center">
        Ada masalah saat memuat halaman ini.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition"
      >
        Coba Lagi
      </button>
    </div>
  );
}