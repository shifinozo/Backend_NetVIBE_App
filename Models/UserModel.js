

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
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    postsCount: {
      type: Number,
      default: 0
    },
    posts: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
],

  },


  { timestamps: true }
);

export const userModel= mongoose.model("User", userSchema);
