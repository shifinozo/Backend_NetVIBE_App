

import mongoose from "mongoose";

 const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
    },

    googleId: {
      type: String,
      default: null,
    },

    profilePic: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],

    postsCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const userModel= mongoose.model("user", userSchema);
