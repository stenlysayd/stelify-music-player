// prisma/seed.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.createMany({
    data: [
      {
        title: "Lagu Pertama",
        artist: "Band A",
        audioUrl: "/music/song1.mp3"
      },
      {
        title: "Lagu Kedua",
        artist: "Band B",
        audioUrl: "/music/song2.mp3"
      }
    ]
  });
}

main()
  .then(() => console.log("✅ Seed data inserted"))
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
