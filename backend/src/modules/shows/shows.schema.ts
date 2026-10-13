import { z } from "zod";

export const showIdParamSchema = z.object({
  id: z.string().uuid("Invalid show id"),
});

export const createShowSchema = z.object({
  movieId: z.string().uuid("Invalid movie id"),
  startAt: z.coerce.date({ errorMap: () => ({ message: "A valid start date and time is required" }) }),
  price: z.coerce.number().positive("Price must be greater than zero"),
});

export const holdSeatsSchema = z.object({
  seats: z
    .array(z.string().trim().min(2).max(3))
    .min(1, "Select at least one seat")
    .max(6, "You can select up to 6 seats at a time")
    .refine((seats) => new Set(seats.map((s) => s.toUpperCase())).size === seats.length, {
      message: "Duplicate seats are not allowed",
    }),
});

export const paymentSchema = z.object({
  paymentStatus: z.enum(["success", "failure"]),
});

export type CreateShowInput = z.infer<typeof createShowSchema>;
export type HoldSeatsInput = z.infer<typeof holdSeatsSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
