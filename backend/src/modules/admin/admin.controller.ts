import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { createMovie, updateMovie, deleteMovie, listMoviesForAdmin } from "../movies/movies.service";

export const getAdminMovies = asyncHandler(async (_req: Request, res: Response) => {
  const movies = await listMoviesForAdmin();
  res.status(200).json({ movies });
});

export const postCreateMovie = asyncHandler(async (req: Request, res: Response) => {
  const movie = await createMovie(req.body);
  res.status(201).json({ movie });
});

export const putUpdateMovie = asyncHandler(async (req: Request, res: Response) => {
  const movie = await updateMovie(req.params.id, req.body);
  res.status(200).json({ movie });
});

export const deleteMovieHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteMovie(req.params.id);
  res.status(204).send();
});
