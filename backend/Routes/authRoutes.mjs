import { Router } from "express";
import { registerUser, loginUser, adminLogin, logoutUser, trackAction } from "../controllers/authController.mjs";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login",adminLogin);
router.post("/logout", logoutUser);
router.post("/track-action", trackAction)

export default router;