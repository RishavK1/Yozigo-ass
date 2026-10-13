import { Prisma, SeatStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { env } from "../../config/env";
import { generateSeatGrid, parseSeatLabel, TOTAL_SEATS } from "../../utils/seatMap";
import { CreateShowInput } from "./shows.schema";

interface LockedSeatRow {
  id: string;
  status: SeatStatus;
  heldById: string | null;
  heldUntil: Date | null;
}

function isSeatAvailableNow(status: SeatStatus, heldUntil: Date | null): boolean {
  if (status === "AVAILABLE") return true;
  if (status === "HELD" && heldUntil && heldUntil.getTime() < Date.now()) return true;
  return false;
}

export async function getAvailableSeatsCount(showId: string): Promise<number> {
  const now = new Date();
  return prisma.seat.count({
    where: {
      showId,
      OR: [{ status: "AVAILABLE" }, { status: "HELD", heldUntil: { lt: now } }],
    },
  });
}

export async function getUpcomingShowsGroupedByDate(movieId: string) {
  const shows = await prisma.show.findMany({
    where: { movieId, startAt: { gt: new Date() } },
    orderBy: { startAt: "asc" },
  });

  const grouped = new Map<string, Array<Record<string, unknown>>>();

  for (const show of shows) {
    const availableSeats = await getAvailableSeatsCount(show.id);
    const dateKey = show.startAt.toISOString().slice(0, 10);
    const entry = {
      id: show.id,
      startAt: show.startAt,
      price: Number(show.price),
      availableSeats,
      totalSeats: TOTAL_SEATS,
    };
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(entry);
  }

  return Array.from(grouped.entries()).map(([date, shows]) => ({ date, shows }));
}

export async function getShowWithMovie(showId: string) {
  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: { movie: true },
  });
  if (!show) {
    throw ApiError.notFound("Show not found");
  }
  return show;
}

export async function getSeatMap(showId: string, viewerId?: string) {
  const show = await getShowWithMovie(showId);
  const seats = await prisma.seat.findMany({
    where: { showId },
    orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
  });

  const now = Date.now();
  const seatMap = seats.map((seat) => {
    const expired = seat.status === "HELD" && seat.heldUntil !== null && seat.heldUntil.getTime() < now;
    const effectiveStatus: SeatStatus = expired ? "AVAILABLE" : seat.status;
    return {
      id: seat.id,
      label: `${seat.rowLabel}${seat.seatNumber}`,
      rowLabel: seat.rowLabel,
      seatNumber: seat.seatNumber,
      status: effectiveStatus,
      heldByMe: effectiveStatus === "HELD" && viewerId != null && seat.heldById === viewerId,
    };
  });

  return {
    show: {
      id: show.id,
      startAt: show.startAt,
      endAt: show.endAt,
      price: Number(show.price),
      movie: {
        id: show.movie.id,
        title: show.movie.title,
        durationMinutes: show.movie.durationMinutes,
      },
    },
    seats: seatMap,
  };
}

export async function holdSeats(showId: string, userId: string, labels: string[]) {
  const normalizedLabels = labels.map((label) => label.trim().toUpperCase());
  const parsedSeats = normalizedLabels.map(parseSeatLabel);

  if (parsedSeats.some((seat) => seat === null)) {
    throw ApiError.badRequest("One or more seat labels are invalid");
  }

  const show = await prisma.show.findUnique({ where: { id: showId } });
  if (!show) {
    throw ApiError.notFound("Show not found");
  }
  if (show.startAt.getTime() < Date.now()) {
    throw ApiError.badRequest("This show has already started");
  }

  const seatRecords = await prisma.seat.findMany({
    where: {
      showId,
      OR: parsedSeats.map((seat) => ({ rowLabel: seat!.rowLabel, seatNumber: seat!.seatNumber })),
    },
    select: { id: true },
  });

  if (seatRecords.length !== normalizedLabels.length) {
    throw ApiError.badRequest("One or more selected seats do not exist for this show");
  }

  const seatIds = seatRecords.map((seat) => seat.id);
  const holdUntil = new Date(Date.now() + env.seatHoldMinutes * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const lockedSeats = await tx.$queryRaw<LockedSeatRow[]>(
      Prisma.sql`SELECT id, status, "heldById", "heldUntil" FROM seats WHERE id = ANY(${seatIds}) FOR UPDATE`,
    );

    const unavailableSeatIds = lockedSeats
      .filter((seat) => !isSeatAvailableNow(seat.status, seat.heldUntil) && seat.heldById !== userId)
      .map((seat) => seat.id);

    if (unavailableSeatIds.length > 0) {
      const unavailableLabels = await tx.seat.findMany({
        where: { id: { in: unavailableSeatIds } },
        select: { rowLabel: true, seatNumber: true },
      });
      throw ApiError.conflict(
        "Some of the seats you selected were just taken, please choose again",
        unavailableLabels.map((seat) => `${seat.rowLabel}${seat.seatNumber}`),
      );
    }

    await tx.seat.updateMany({
      where: { showId, heldById: userId, id: { notIn: seatIds } },
      data: { status: "AVAILABLE", heldById: null, heldUntil: null },
    });

    await tx.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: "HELD", heldById: userId, heldUntil: holdUntil },
    });

    const heldSeats = await tx.seat.findMany({
      where: { id: { in: seatIds } },
      orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
    });

    return {
      showId,
      seats: heldSeats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`),
      heldUntil: holdUntil,
      totalAmount: Number(show.price) * seatIds.length,
      pricePerSeat: Number(show.price),
    };
  });
}

export async function getActiveHold(showId: string, userId: string) {
  const now = new Date();
  const seats = await prisma.seat.findMany({
    where: { showId, heldById: userId, status: "HELD", heldUntil: { gt: now } },
    orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
  });

  if (seats.length === 0) {
    return null;
  }

  const show = await getShowWithMovie(showId);
  return {
    showId,
    seats: seats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`),
    heldUntil: seats[0].heldUntil,
    totalAmount: Number(show.price) * seats.length,
    pricePerSeat: Number(show.price),
  };
}

export async function confirmBooking(showId: string, userId: string, paymentStatus: "success" | "failure") {
  const now = new Date();
  const heldSeats = await prisma.seat.findMany({
    where: { showId, heldById: userId, status: "HELD" },
    orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
  });

  if (heldSeats.length === 0) {
    throw ApiError.badRequest("No active seat hold found, please select your seats again");
  }

  const holdExpired = heldSeats[0].heldUntil !== null && heldSeats[0].heldUntil.getTime() < now.getTime();
  if (holdExpired) {
    await prisma.seat.updateMany({
      where: { id: { in: heldSeats.map((seat) => seat.id) } },
      data: { status: "AVAILABLE", heldById: null, heldUntil: null },
    });
    throw ApiError.conflict("Your seat hold has expired, please select your seats again");
  }

  if (paymentStatus === "failure") {
    return {
      status: "failed" as const,
      message: "Payment failed, you can try again before your hold expires",
      heldUntil: heldSeats[0].heldUntil,
      seats: heldSeats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`),
    };
  }

  const show = await getShowWithMovie(showId);
  const seatIds = heldSeats.map((seat) => seat.id);

  const booking = await prisma.$transaction(async (tx) => {
    const lockedSeats = await tx.$queryRaw<LockedSeatRow[]>(
      Prisma.sql`SELECT id, status, "heldById", "heldUntil" FROM seats WHERE id = ANY(${seatIds}) FOR UPDATE`,
    );

    const invalidSeats = lockedSeats.filter(
      (seat) =>
        seat.status !== "HELD" ||
        seat.heldById !== userId ||
        !seat.heldUntil ||
        seat.heldUntil.getTime() < Date.now(),
    );

    if (invalidSeats.length > 0) {
      throw ApiError.conflict("Your seat hold has expired or changed, please select your seats again");
    }

    const totalAmount = Number(show.price) * heldSeats.length;

    const createdBooking = await tx.booking.create({
      data: {
        userId,
        showId,
        totalAmount,
        status: "CONFIRMED",
        seats: {
          create: heldSeats.map((seat) => ({
            seatId: seat.id,
            rowLabel: seat.rowLabel,
            seatNumber: seat.seatNumber,
          })),
        },
      },
      include: { seats: true },
    });

    await tx.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: "BOOKED", heldById: null, heldUntil: null },
    });

    return createdBooking;
  });

  return {
    status: "confirmed" as const,
    booking: {
      id: booking.id,
      totalAmount: Number(booking.totalAmount),
      status: booking.status,
      createdAt: booking.createdAt,
      seats: booking.seats
        .sort((a, b) => a.rowLabel.localeCompare(b.rowLabel) || a.seatNumber - b.seatNumber)
        .map((seat) => `${seat.rowLabel}${seat.seatNumber}`),
      show: {
        id: show.id,
        startAt: show.startAt,
        price: Number(show.price),
      },
      movie: {
        id: show.movie.id,
        title: show.movie.title,
        posterUrl: show.movie.posterUrl,
        language: show.movie.language,
      },
    },
  };
}

export async function createShow(input: CreateShowInput) {
  const movie = await prisma.movie.findUnique({ where: { id: input.movieId } });
  if (!movie) {
    throw ApiError.notFound("Movie not found");
  }

  if (input.startAt.getTime() < Date.now()) {
    throw ApiError.badRequest("Show start time must be in the future");
  }

  const endAt = new Date(input.startAt.getTime() + movie.durationMinutes * 60 * 1000);

  const overlapping = await prisma.show.findFirst({
    where: {
      startAt: { lt: endAt },
      endAt: { gt: input.startAt },
    },
    include: { movie: true },
  });

  if (overlapping) {
    throw ApiError.conflict(
      `This time overlaps with an existing show (${overlapping.movie.title} at ${overlapping.startAt.toISOString()})`,
    );
  }

  const createdShow = await prisma.$transaction(async (tx) => {
    const show = await tx.show.create({
      data: {
        movieId: input.movieId,
        startAt: input.startAt,
        endAt,
        price: input.price,
      },
    });

    await tx.seat.createMany({
      data: generateSeatGrid().map((seat) => ({
        showId: show.id,
        rowLabel: seat.rowLabel,
        seatNumber: seat.seatNumber,
      })),
    });

    return show;
  });

  return {
    id: createdShow.id,
    movieId: createdShow.movieId,
    startAt: createdShow.startAt,
    endAt: createdShow.endAt,
    price: Number(createdShow.price),
  };
}

export async function deleteShow(showId: string) {
  const show = await prisma.show.findUnique({ where: { id: showId } });
  if (!show) {
    throw ApiError.notFound("Show not found");
  }

  const bookingCount = await prisma.booking.count({ where: { showId } });
  if (bookingCount > 0) {
    throw ApiError.conflict("This show already has bookings and cannot be deleted");
  }

  await prisma.show.delete({ where: { id: showId } });
}

export async function listAllShowsForAdmin() {
  const shows = await prisma.show.findMany({
    orderBy: { startAt: "desc" },
    include: { movie: true },
  });

  const results = [];
  for (const show of shows) {
    const bookedCount = await prisma.seat.count({ where: { showId: show.id, status: "BOOKED" } });
    results.push({
      id: show.id,
      startAt: show.startAt,
      endAt: show.endAt,
      price: Number(show.price),
      movie: { id: show.movie.id, title: show.movie.title },
      bookedCount,
      totalSeats: TOTAL_SEATS,
      percentFull: Math.round((bookedCount / TOTAL_SEATS) * 100),
    });
  }
  return results;
}

export async function getShowStats(showId: string) {
  const show = await getShowWithMovie(showId);
  const bookedCount = await prisma.seat.count({ where: { showId, status: "BOOKED" } });
  const revenue = await prisma.booking.aggregate({
    where: { showId, status: "CONFIRMED" },
    _sum: { totalAmount: true },
  });

  return {
    show: {
      id: show.id,
      startAt: show.startAt,
      price: Number(show.price),
      movie: { id: show.movie.id, title: show.movie.title },
    },
    bookedSeats: bookedCount,
    totalSeats: TOTAL_SEATS,
    percentFull: Math.round((bookedCount / TOTAL_SEATS) * 100),
    totalRevenue: Number(revenue._sum.totalAmount ?? 0),
  };
}

export async function getShowBookingsForAdmin(showId: string) {
  await getShowWithMovie(showId);
  const bookings = await prisma.booking.findMany({
    where: { showId },
    include: { user: true, seats: true },
    orderBy: { createdAt: "desc" },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    status: booking.status,
    totalAmount: Number(booking.totalAmount),
    createdAt: booking.createdAt,
    customerName: booking.user.name,
    customerEmail: booking.user.email,
    seats: booking.seats
      .sort((a, b) => a.rowLabel.localeCompare(b.rowLabel) || a.seatNumber - b.seatNumber)
      .map((seat) => `${seat.rowLabel}${seat.seatNumber}`),
  }));
}
