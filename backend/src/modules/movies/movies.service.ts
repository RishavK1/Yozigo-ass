import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { CreateMovieInput, UpdateMovieInput } from "./movies.schema";
import { getUpcomingShowsGroupedByDate } from "../shows/shows.service";

export async function listMovies() {
  const movies = await prisma.movie.findMany({ orderBy: { createdAt: "desc" } });
  return movies.map((movie) => ({
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    language: movie.language,
    durationMinutes: movie.durationMinutes,
    rating: movie.rating,
    description: movie.description,
  }));
}

export async function getMovieDetail(movieId: string) {
  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) {
    throw ApiError.notFound("Movie not found");
  }

  const showsByDate = await getUpcomingShowsGroupedByDate(movieId);

  return {
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    language: movie.language,
    durationMinutes: movie.durationMinutes,
    rating: movie.rating,
    description: movie.description,
    showsByDate,
  };
}

export async function createMovie(input: CreateMovieInput) {
  return prisma.movie.create({ data: input });
}

export async function updateMovie(movieId: string, input: UpdateMovieInput) {
  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) {
    throw ApiError.notFound("Movie not found");
  }
  return prisma.movie.update({ where: { id: movieId }, data: input });
}

export async function deleteMovie(movieId: string) {
  const movie = await prisma.movie.findUnique({ where: { id: movieId }, include: { shows: true } });
  if (!movie) {
    throw ApiError.notFound("Movie not found");
  }

  const showIds = movie.shows.map((show) => show.id);
  if (showIds.length > 0) {
    const bookingCount = await prisma.booking.count({ where: { showId: { in: showIds } } });
    if (bookingCount > 0) {
      throw ApiError.conflict("This movie has shows with existing bookings and cannot be deleted");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.show.deleteMany({ where: { movieId } });
    await tx.movie.delete({ where: { id: movieId } });
  });
}

export async function listMoviesForAdmin() {
  return prisma.movie.findMany({ orderBy: { createdAt: "desc" } });
}
