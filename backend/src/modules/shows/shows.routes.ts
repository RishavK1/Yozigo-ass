import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { authenticate, optionalAuthenticate } from "../../middleware/auth.middleware";
import { showIdParamSchema, holdSeatsSchema, paymentSchema } from "./shows.schema";
import { getSeats, postHold, getHold, postPayment } from "./shows.controller";

const router = Router();

router.get("/:id/seats", validate(showIdParamSchema, "params"), optionalAuthenticate, getSeats);

router.get("/:id/hold", validate(showIdParamSchema, "params"), authenticate, getHold);

router.post(
  "/:id/hold",
  validate(showIdParamSchema, "params"),
  authenticate,
  validate(holdSeatsSchema),
  postHold,
);

router.post(
  "/:id/book",
  validate(showIdParamSchema, "params"),
  authenticate,
  validate(paymentSchema),
  postPayment,
);

export default router;
