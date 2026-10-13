import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { authenticate, requireRole } from "../../middleware/auth.middleware";
import { createMovieSchema, updateMovieSchema, movieIdParamSchema } from "../movies/movies.schema";
import { createShowSchema, showIdParamSchema } from "../shows/shows.schema";
import {
  getAdminMovies,
  postCreateMovie,
  putUpdateMovie,
  deleteMovieHandler,
} from "./admin.controller";
import {
  postCreateShow,
  deleteShowHandler,
  getAdminShows,
  getAdminShowStats,
  getAdminShowBookings,
  getSeats,
} from "../shows/shows.controller";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/movies", getAdminMovies);
router.post("/movies", validate(createMovieSchema), postCreateMovie);
router.put(
  "/movies/:id",
  validate(movieIdParamSchema, "params"),
  validate(updateMovieSchema),
  putUpdateMovie,
);
router.delete("/movies/:id", validate(movieIdParamSchema, "params"), deleteMovieHandler);

router.get("/shows", getAdminShows);
router.post("/shows", validate(createShowSchema), postCreateShow);
router.delete("/shows/:id", validate(showIdParamSchema, "params"), deleteShowHandler);
router.get("/shows/:id/stats", validate(showIdParamSchema, "params"), getAdminShowStats);
router.get("/shows/:id/bookings", validate(showIdParamSchema, "params"), getAdminShowBookings);
router.get("/shows/:id/seats", validate(showIdParamSchema, "params"), getSeats);

export default router;
