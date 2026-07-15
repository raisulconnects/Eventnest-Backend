import { Router } from "express";
import {
  createContactSubmission,
  getAllContactSubmissions,
  deleteContactSubmission,
} from "../controllers/contactController";
import { validate } from "../middleware/validateMiddleware";
import { createContactSchema } from "../validations/contactValidation";
import { protect } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";

const router = Router();

router.get("/", protect, requireRole("admin"), getAllContactSubmissions);
router.post("/", validate(createContactSchema), createContactSubmission);
router.delete("/:id", protect, requireRole("admin"), deleteContactSubmission);

export default router;
