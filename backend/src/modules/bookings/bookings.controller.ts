import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { listMyBookings, getMyBookingById, cancelMyBooking } from "./bookings.service";

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await listMyBookings(req.user!.id);
  res.status(200).json(bookings);
});

export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await getMyBookingById(req.params.id, req.user!.id);
  res.status(200).json({ booking });
});

export const postCancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await cancelMyBooking(req.params.id, req.user!.id);
  res.status(200).json({ booking });
});
