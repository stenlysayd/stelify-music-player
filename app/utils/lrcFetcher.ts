// utils/lrcFetcher.ts

export async function fetchLrcFromApi(artist: string, title: string, duration?: number) {
  try {
    // Bersihkan string agar pencarian lebih akurat (hapus karakter aneh)
    const cleanArtist = artist.trim();
    const cleanTitle = title.replace(/\(.*\)|\[.*\]/g, "").trim(); // Hapus (feat.) atau [Official]

    let url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
    
    // Jika ada durasi, tambahkan ke parameter (LRCLIB memprioritaskan durasi yg cocok)
    if (duration) {
      url += `&duration=${Math.round(duration)}`;
    }

    const res = await fetch(url);
    
    if (!res.ok) {
      // Jika 404 (Not Found), coba endpoint search (lebih lambat tapi fuzzy)
      if (res.status === 404) {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanArtist + " " + cleanTitle)}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        // Ambil hasil pertama yang memiliki lirik synced
        if (Array.isArray(searchData) && searchData.length > 0) {
           return searchData[0].syncedLyrics || searchData[0].plainLyrics || "";
        }
      }
      return "";
    }

    const data = await res.json();
    return data.syncedLyrics || data.plainLyrics || "";
    
  } catch (error) {
    console.error("Gagal mengambil lirik:", error);
    return "";
  }
}