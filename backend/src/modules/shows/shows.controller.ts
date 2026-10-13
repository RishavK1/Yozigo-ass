import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getSeatMap,
  holdSeats,
  getActiveHold,
  confirmBooking,
  createShow,
  deleteShow,
  listAllShowsForAdmin,
  getShowStats,
  getShowBookingsForAdmin,
} from "./shows.service";

export const getSeats = asyncHandler(async (req: Request, res: Response) => {
  const seatMap = await getSeatMap(req.params.id, req.user?.id);
  res.status(200).json(seatMap);
});

export const postHold = asyncHandler(async (req: Request, res: Response) => {
  const hold = await holdSeats(req.params.id, req.user!.id, req.body.seats);
  res.status(200).json({ hold });
});

export const getHold = asyncHandler(async (req: Request, res: Response) => {
  const hold = await getActiveHold(req.params.id, req.user!.id);
  res.status(200).json({ hold });
});

export const postPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await confirmBooking(req.params.id, req.user!.id, req.body.paymentStatus);
  res.status(result.status === "confirmed" ? 201 : 200).json(result);
});

export const postCreateShow = asyncHandler(async (req: Request, res: Response) => {
  const show = await createShow(req.body);
  res.status(201).json({ show });
});

export const deleteShowHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteShow(req.params.id);
  res.status(204).send();
});

export const getAdminShows = asyncHandler(async (_req: Request, res: Response) => {
  const shows = await listAllShowsForAdmin();
  res.status(200).json({ shows });
});

export const getAdminShowStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await getShowStats(req.params.id);
  res.status(200).json({ stats });
});

export const getAdminShowBookings = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await getShowBookingsForAdmin(req.params.id);
  res.status(200).json({ bookings });
});
