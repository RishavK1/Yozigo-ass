import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateSeatGrid } from "../src/utils/seatMap";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  const adminEmail = "admin@yozigo.com";
  const customerEmail = "customer@yozigo.com";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Yozigo Admin",
      email: adminEmail,
      passwordHash: await hash("Admin@1234"),
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      name: "Test Customer",
      email: customerEmail,
      passwordHash: await hash("Customer@1234"),
      role: "CUSTOMER",
    },
  });

  const movieCount = await prisma.movie.count();
  if (movieCount > 0) {
    console.log("Movies already seeded, skipping movie and show creation");
    return;
  }

  const movies = await Promise.all([
    prisma.movie.create({
      data: {
        title: "Interstellar Horizons",
        posterUrl: "https://placehold.co/400x600?text=Interstellar+Horizons",
        language: "English",
        durationMinutes: 150,
        rating: "UA",
        description: "A crew of explorers travel beyond our galaxy to ensure humanity's survival.",
      },
    }),
    prisma.movie.create({
      data: {
        title: "The Last Monsoon",
        posterUrl: "https://placehold.co/400x600?text=The+Last+Monsoon",
        language: "Hindi",
        durationMinutes: 135,
        rating: "U",
        description: "A heartfelt drama about a family finding hope during the rainy season.",
      },
    }),
    prisma.movie.create({
      data: {
        title: "Midnight Protocol",
        posterUrl: "https://placehold.co/400x600?text=Midnight+Protocol",
        language: "English",
        durationMinutes: 120,
        rating: "A",
        description: "A hacker uncovers a conspiracy that threatens the city's power grid.",
      },
    }),
  ]);

  const now = new Date();
  const seatGrid = generateSeatGrid();

  const showTimes = [
    { dayOffset: 1, hour: 10, movieIndex: 0, price: 220 },
    { dayOffset: 1, hour: 18, movieIndex: 0, price: 280 },
    { dayOffset: 2, hour: 14, movieIndex: 1, price: 200 },
    { dayOffset: 2, hour: 21, movieIndex: 2, price: 250 },
    { dayOffset: 3, hour: 11, movieIndex: 2, price: 220 },
  ];

  for (const showTime of showTimes) {
    const movie = movies[showTime.movieIndex];
    const startAt = new Date(now);
    startAt.setDate(startAt.getDate() + showTime.dayOffset);
    startAt.setHours(showTime.hour, 0, 0, 0);
    const endAt = new Date(startAt.getTime() + movie.durationMinutes * 60 * 1000);

    const show = await prisma.show.create({
      data: {
        movieId: movie.id,
        startAt,
        endAt,
        price: showTime.price,
      },
    });

    await prisma.seat.createMany({
      data: seatGrid.map((seat) => ({
        showId: show.id,
        rowLabel: seat.rowLabel,
        seatNumber: seat.seatNumber,
      })),
    });
  }

  console.log("Seed data created successfully");
  console.log(`Admin login: ${adminEmail} / Admin@1234`);
  console.log(`Customer login: ${customerEmail} / Customer@1234`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
