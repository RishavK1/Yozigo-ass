import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { listMovies, getMovieDetail } from "./movies.service";

export const getMovies = asyncHandler(async (_req: Request, res: Response) => {
  const movies = await listMovies();
  res.status(200).json({ movies });
});

export const getMovie = asyncHandler(async (req: Request, res: Response) => {
  const movie = await getMovieDetail(req.params.id);
  res.status(200).json({ movie });
});
