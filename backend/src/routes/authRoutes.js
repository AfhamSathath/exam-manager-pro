import express from "express";
import { register, login } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { getMe } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe); 


export default router;
