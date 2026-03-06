import express from "express";
import { getAllSessions } from "../controllers/adminController.mjs";

const router = express.Router();

router.get("/sessions", getAllSessions);

export default router;