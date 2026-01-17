
import { Notification } from "../Models/Notificationmodel.js";




export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "username profilePic")
      .populate("post", "media");

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


