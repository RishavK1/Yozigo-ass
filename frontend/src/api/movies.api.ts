import { apiClient } from "./client";
import type { Movie, MovieDetail } from "@/types";

export async function fetchMovies(): Promise<Movie[]> {
  const response = await apiClient.get<{ movies: Movie[] }>("/movies");
  return response.data.movies;
}

export async function fetchMovieDetail(movieId: string): Promise<MovieDetail> {
  const response = await apiClient.get<{ movie: MovieDetail }>(`/movies/${movieId}`);
  return response.data.movie;
}
