import { apiClient } from "./client";
import type { Hold, PaymentResult, SeatMapResponse } from "@/types";

export async function fetchSeatMap(showId: string): Promise<SeatMapResponse> {
  const response = await apiClient.get<SeatMapResponse>(`/shows/${showId}/seats`);
  return response.data;
}

export async function fetchActiveHold(showId: string): Promise<Hold | null> {
  const response = await apiClient.get<{ hold: Hold | null }>(`/shows/${showId}/hold`);
  return response.data.hold;
}

export async function holdSeats(showId: string, seats: string[]): Promise<Hold> {
  const response = await apiClient.post<{ hold: Hold }>(`/shows/${showId}/hold`, { seats });
  return response.data.hold;
}

export async function payForBooking(
  showId: string,
  paymentStatus: "success" | "failure",
): Promise<PaymentResult> {
  const response = await apiClient.post<PaymentResult>(`/shows/${showId}/book`, { paymentStatus });
  return response.data;
}
