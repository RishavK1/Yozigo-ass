import { apiClient } from "./client";
import type { AdminShow, AdminShowBooking, AdminShowStats, Movie, SeatMapResponse } from "@/types";

export interface MovieFormInput {
  title: string;
  posterUrl: string;
  language: string;
  durationMinutes: number;
  rating: "U" | "UA" | "A";
  description?: string;
}

export interface ShowFormInput {
  movieId: string;
  startAt: string;
  price: number;
}

export async function fetchAdminMovies(): Promise<Movie[]> {
  const response = await apiClient.get<{ movies: Movie[] }>("/admin/movies");
  return response.data.movies;
}

export async function createMovie(payload: MovieFormInput): Promise<Movie> {
  const response = await apiClient.post<{ movie: Movie }>("/admin/movies", payload);
  return response.data.movie;
}

export async function updateMovie(movieId: string, payload: Partial<MovieFormInput>): Promise<Movie> {
  const response = await apiClient.put<{ movie: Movie }>(`/admin/movies/${movieId}`, payload);
  return response.data.movie;
}

export async function deleteMovie(movieId: string): Promise<void> {
  await apiClient.delete(`/admin/movies/${movieId}`);
}

export async function fetchAdminShows(): Promise<AdminShow[]> {
  const response = await apiClient.get<{ shows: AdminShow[] }>("/admin/shows");
  return response.data.shows;
}

export interface CreatedShow {
  id: string;
  movieId: string;
  startAt: string;
  endAt: string;
  price: number;
}

export async function createShow(payload: ShowFormInput): Promise<CreatedShow> {
  const response = await apiClient.post<{ show: CreatedShow }>("/admin/shows", payload);
  return response.data.show;
}

export async function deleteShow(showId: string): Promise<void> {
  await apiClient.delete(`/admin/shows/${showId}`);
}

export async function fetchAdminShowStats(showId: string): Promise<AdminShowStats> {
  const response = await apiClient.get<{ stats: AdminShowStats }>(`/admin/shows/${showId}/stats`);
  return response.data.stats;
}

export async function fetchAdminShowBookings(showId: string): Promise<AdminShowBooking[]> {
  const response = await apiClient.get<{ bookings: AdminShowBooking[] }>(`/admin/shows/${showId}/bookings`);
  return response.data.bookings;
}

export async function fetchAdminShowSeatMap(showId: string): Promise<SeatMapResponse> {
  const response = await apiClient.get<SeatMapResponse>(`/admin/shows/${showId}/seats`);
  return response.data;
}
