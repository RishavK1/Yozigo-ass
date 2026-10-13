import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { env } from "../../config/env";

function serializeBooking(booking: {
  id: string;
  totalAmount: Prisma.Decimal | number;
  status: string;
  createdAt: Date;
  cancelledAt: Date | null;
  show: { id: string; startAt: Date; movie: { id: string; title: string; posterUrl: string; language: string } };
  seats: Array<{ rowLabel: string; seatNumber: number }>;
}) {
  return {
    id: booking.id,
    status: booking.status,
    totalAmount: Number(booking.totalAmount),
    createdAt: booking.createdAt,
    cancelledAt: booking.cancelledAt,
    seats: booking.seats
      .slice()
      .sort((a, b) => a.rowLabel.localeCompare(b.rowLabel) || a.seatNumber - b.seatNumber)
      .map((seat) => `${seat.rowLabel}${seat.seatNumber}`),
    show: {
      id: booking.show.id,
      startAt: booking.show.startAt,
    },
    movie: {
      id: booking.show.movie.id,
      title: booking.show.movie.title,
      posterUrl: booking.show.movie.posterUrl,
      language: booking.show.movie.language,
    },
  };
}

export async function listMyBookings(userId: string) {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: { show: { include: { movie: true } }, seats: true },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const serialized = bookings.map(serializeBooking);

  const upcoming = serialized
    .filter((booking) => new Date(booking.show.startAt).getTime() > now)
    .sort((a, b) => new Date(a.show.startAt).getTime() - new Date(b.show.startAt).getTime());

  const past = serialized
    .filter((booking) => new Date(booking.show.startAt).getTime() <= now)
    .sort((a, b) => new Date(b.show.startAt).getTime() - new Date(a.show.startAt).getTime());

  return { upcoming, past };
}

export async function getMyBookingById(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: { show: { include: { movie: true } }, seats: true },
  });

  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  return serializeBooking(booking);
}

export async function cancelMyBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: { show: true, seats: true },
  });

  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  if (booking.status === "CANCELLED") {
    throw ApiError.badRequest("This booking has already been cancelled");
  }

  const now = Date.now();
  const showStart = booking.show.startAt.getTime();

  if (showStart <= now) {
    throw ApiError.badRequest("This show has already taken place, it cannot be cancelled");
  }

  const cutoffMs = env.cancellationCutoffHours * 60 * 60 * 1000;
  if (showStart - now < cutoffMs) {
    throw ApiError.badRequest(
      `Bookings can only be cancelled at least ${env.cancellationCutoffHours} hours before the show`,
    );
  }

  const seatIds = booking.seats.map((seat) => seat.seatId);

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await tx.seat.updateMany({
      where: { id: { in: seatIds }, status: "BOOKED" },
      data: { status: "AVAILABLE", heldById: null, heldUntil: null },
    });
  });

  return getMyBookingById(bookingId, userId);
}
