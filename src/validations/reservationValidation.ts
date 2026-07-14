import { z } from "zod";

export const createReservationSchema = z.object({
  attendees: z.coerce.number().int().min(1).max(10).optional().default(1),
});
