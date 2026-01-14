

import express from "express";
import {
  editProfile,
  followUnfollowUser,
  getUserProfile,
  searchUsers,
  UserProfile
} from "../controllers/profilefetch.js";

import Verifytoken from "../Middlewares/verifytoken.js";
import upload from "../Middlewares/multer.js";

export const proute = express.Router();


proute.get("/profile/:username", UserProfile);


proute.get("/users/:id", Verifytoken, getUserProfile);


proute.get("/search/users", Verifytoken, searchUsers);

proute.post("/follow/:id", Verifytoken, followUnfollowUser);

// proute.get("/profile/me", Verifytoken, getMyProfile)



proute.put(
  "/profile/edit",
  Verifytoken,
  upload.single("profilePic"),
  editProfile
);

// -----------------------------------------------------



