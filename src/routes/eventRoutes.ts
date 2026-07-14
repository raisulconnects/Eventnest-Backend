import { Router } from "express";
import {
  getAllEvents,
  getFeaturedEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getRelatedEvents,
} from "../controllers/eventController";
import { validate } from "../middleware/validateMiddleware";
import { createEventSchema } from "../validations/eventValidation";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/featured", getFeaturedEvents);
router.get("/related/:id", getRelatedEvents);
router.get("/", getAllEvents);
router.get("/:id", getEventById);

router.post("/", protect, validate(createEventSchema), createEvent);
router.put("/:id", protect, validate(createEventSchema), updateEvent);
router.delete("/:id", protect, deleteEvent);

export default router;
