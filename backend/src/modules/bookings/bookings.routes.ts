import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { bookingIdParamSchema } from "./bookings.schema";
import { getBookings, getBooking, postCancelBooking } from "./bookings.controller";

const router = Router();

router.use(authenticate);

router.get("/", getBookings);
router.get("/:id", validate(bookingIdParamSchema, "params"), getBooking);
router.post("/:id/cancel", validate(bookingIdParamSchema, "params"), postCancelBooking);

export default router;
