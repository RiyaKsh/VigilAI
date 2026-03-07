import express from "express";
import { getAllSessions } from "../controllers/adminController.mjs";
import {
    getUsersRisk,
    getUserSession,
    getAlerts
} from "../controllers/adminController.mjs";
import { getSessionDetails } from "../controllers/adminController.mjs";
import { getLiveAlerts } from "../controllers/adminController.mjs";


const router = express.Router();

router.get("/sessions", getAllSessions);
router.get("/users-risk", getUsersRisk);
router.get("/user/:user_id", getUserSession);
router.get("/alerts", getAlerts);
router.get("/session/:session_id", getSessionDetails);
router.get("/alerts", getLiveAlerts);
export default router;