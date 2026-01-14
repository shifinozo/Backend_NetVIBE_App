import express from "express";
import { getNotifications } from "../controllers/notificationController.js";
import Verifytoken from "../Middlewares/verifytoken.js";

const notirouter = express.Router();

notirouter.get("/notifications", Verifytoken, getNotifications);

export default notirouter;
