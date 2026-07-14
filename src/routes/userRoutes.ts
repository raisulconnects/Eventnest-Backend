import { Router } from "express";
import {
  getCurrentUserEvents,
  getAllUsers,
} from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";

const router = Router();

router.get("/events", protect, getCurrentUserEvents);
router.get("/all", protect, requireRole("admin"), getAllUsers);

export default router;
