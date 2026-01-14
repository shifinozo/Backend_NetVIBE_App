import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      enum: ["like", "comment", "follow"], 
      required: true 
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // Only for like/comment
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
