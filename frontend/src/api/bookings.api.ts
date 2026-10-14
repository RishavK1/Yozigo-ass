import { apiClient } from "./client";
import type { BookingSummary, MyBookingsResponse } from "@/types";

export async function fetchMyBookings(): Promise<MyBookingsResponse> {
  const response = await apiClient.get<MyBookingsResponse>("/bookings");
  return response.data;
}

export async function fetchBookingById(bookingId: string): Promise<BookingSummary> {
  const response = await apiClient.get<{ booking: BookingSummary }>(`/bookings/${bookingId}`);
  return response.data.booking;
}

export async function cancelBooking(bookingId: string): Promise<BookingSummary> {
  const response = await apiClient.post<{ booking: BookingSummary }>(`/bookings/${bookingId}/cancel`);
  return response.data.booking;
}
