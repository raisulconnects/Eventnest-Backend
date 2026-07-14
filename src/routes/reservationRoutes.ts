import { Router } from "express";
import {
  createReservation,
  cancelReservation,
  getReservationStatus,
  getMyReservations,
  getAttendees,
} from "../controllers/reservationController";
import { validate } from "../middleware/validateMiddleware";
import { createReservationSchema } from "../validations/reservationValidation";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/mine", protect, getMyReservations);
router.get("/event/:eventId/status", protect, getReservationStatus);
router.get("/event/:eventId/attendees", getAttendees);
router.post(
  "/event/:eventId",
  protect,
  validate(createReservationSchema),
  createReservation
);
router.delete("/event/:eventId", protect, cancelReservation);

export default router;
