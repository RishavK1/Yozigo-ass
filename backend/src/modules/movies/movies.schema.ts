import { z } from "zod";

export const movieRatingSchema = z.enum(["U", "UA", "A"]);

export const createMovieSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  posterUrl: z.string().trim().url("Poster URL must be a valid URL"),
  language: z.string().trim().min(1, "Language is required"),
  durationMinutes: z.coerce.number().int().min(30, "Duration must be at least 30 minutes"),
  rating: movieRatingSchema,
  description: z.string().trim().max(2000).optional(),
});

export const updateMovieSchema = createMovieSchema.partial();

export const movieIdParamSchema = z.object({
  id: z.string().uuid("Invalid movie id"),
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
