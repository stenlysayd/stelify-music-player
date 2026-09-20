import type { NextConfig } from "next";
import createPWA from "@ducanh2912/next-pwa";

// 1. Inisialisasi plugin PWA
const withPWA = createPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // PWA hanya aktif saat build production
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // ✅ PERBAIKAN: Naikkan limit upload body menjadi 20MB (default cuma 4MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  
  devIndicators: false, // Perbaikan: devIndicators biasanya boolean, bukan object kosong

  // Opsi tambahan jika ingin menampilkan gambar dari domain luar di masa depan
  images: {
    remotePatterns: [], 
  },
  
  // ✅ TAMBAHKAN INI: Konfigurasi Webpack untuk ignore react-native-fs
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "react-native-fs": false, // Matikan modul ini
      "fs": false,              // Matikan fs (filesystem) di client side
    };
    return config;
  },
};

// 2. Bungkus nextConfig dengan withPWA
export default withPWA(nextConfig);
