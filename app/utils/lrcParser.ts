export interface LyricLine {
  time: number;
  text: string;
}

export const parseLRC = (lrcString: string | null | undefined): LyricLine[] => {
  if (!lrcString) return [];
  
  const lines = lrcString.split("\n");
  const regex = /^\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\](.*)/;

  return lines
    .map((line) => {
      const match = line.trim().match(regex);
      if (!match) return null;

      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();
      const totalTime = minutes * 60 + seconds;

      return { time: totalTime, text };
    })
    .filter((line): line is LyricLine => line !== null)
    .sort((a, b) => a.time - b.time);
};