import express from "express"
import { sendOtpRegister, verifyOtp } from "../controllers/usercontroller.js";
// import { loginUser, registerUser } from "../controllers/usercontroller.js"



export const router = express.Router()

// router.post("/registerUser",registerUser)
router.post("/send-otp", sendOtpRegister);
router.post("/verify-otp", verifyOtp);


// router.post("/loginUser",loginUser)

