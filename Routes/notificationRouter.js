import express from "express";
import { getNotifications, getUnreadCount, markNotificationsRead } from "../controllers/notificationController.js";
import Verifytoken from "../Middlewares/verifytoken.js";

const notirouter = express.Router();

notirouter.get("/notifications", Verifytoken, getNotifications);

notirouter.get("/notifications/unread-count", Verifytoken, getUnreadCount);

notirouter.put("/notifications/mark-read", Verifytoken, markNotificationsRead);


export default notirouter;
