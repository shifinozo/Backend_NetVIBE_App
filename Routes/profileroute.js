import express from 'express'
import { editProfile, getAllUsers, GetUserProfile } from '../controllers/profilefetch.js'
import Verifytoken from '../Middlewares/verifytoken.js'
import upload from '../Middlewares/multer.js'


export const proute=express.Router()

proute.get("/getUserProfile/:username",Verifytoken, GetUserProfile)

proute.put(
  "/editProfile",
  Verifytoken,
  upload.single("profilePic"),
  editProfile
);
proute.get("/getAllUsers",Verifytoken,getAllUsers)