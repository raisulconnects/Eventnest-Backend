import { Router } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../controllers/authController";
import { validate } from "../middleware/validateMiddleware";
import { registerSchema, loginSchema } from "../validations/authValidation";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/me", protect, getCurrentUser);

export default router;
