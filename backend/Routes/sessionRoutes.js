import express from "express";
import { getSessionStatus } from "../controllers/sessionController.mjs";

const router = express.Router();

router.get("/status/:user_id", getSessionStatus);

export default router;