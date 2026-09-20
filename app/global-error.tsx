"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-black text-white flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-3xl font-bold text-red-500 mb-4">Critical Error</h2>
        <p className="mb-6">Terjadi kesalahan sistem yang fatal.</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
        >
          Refresh Halaman
        </button>
      </body>
    </html>
  );
}