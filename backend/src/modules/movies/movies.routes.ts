import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { movieIdParamSchema } from "./movies.schema";
import { getMovies, getMovie } from "./movies.controller";

const router = Router();

router.get("/", getMovies);
router.get("/:id", validate(movieIdParamSchema, "params"), getMovie);

export default router;
