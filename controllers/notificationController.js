
import { Notification } from "../Models/Notificationmodel.js";


export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "username profilePic")
      .populate("post", "media");

    res.status(200).json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      receiver: req.user.id,
      isRead: false,
    });

    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------------------------------

export const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { receiver: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
