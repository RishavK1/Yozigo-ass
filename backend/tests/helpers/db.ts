import { prisma } from "../../src/config/prisma";

export async function cleanDatabase() {
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.show.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();
}

export async function createMovieWithShow(options?: {
  startAt?: Date;
  durationMinutes?: number;
  price?: number;
}) {
  const movie = await prisma.movie.create({
    data: {
      title: "Test Movie",
      posterUrl: "https://placehold.co/400x600",
      language: "English",
      durationMinutes: options?.durationMinutes ?? 120,
      rating: "UA",
      description: "A movie used for testing",
    },
  });

  const startAt = options?.startAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24);
  const endAt = new Date(startAt.getTime() + movie.durationMinutes * 60 * 1000);
  const price = options?.price ?? 200;

  const show = await prisma.show.create({
    data: { movieId: movie.id, startAt, endAt, price },
  });

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
  await prisma.seat.createMany({
    data: rows.flatMap((row) =>
      Array.from({ length: 10 }, (_, i) => ({
        showId: show.id,
        rowLabel: row,
        seatNumber: i + 1,
      })),
    ),
  });

  return { movie, show };
}
