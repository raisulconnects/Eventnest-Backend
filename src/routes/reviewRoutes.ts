import { Router } from "express";
import {
  getReviewsByEvent,
  createReviewForEvent,
  deleteReview,
} from "../controllers/reviewController";
import { validate } from "../middleware/validateMiddleware";
import { createReviewSchema } from "../validations/reviewValidation";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/event/:eventId", getReviewsByEvent);
router.post(
  "/event/:eventId",
  protect,
  validate(createReviewSchema),
  createReviewForEvent
);
router.delete("/:id", protect, deleteReview);

export default router;
