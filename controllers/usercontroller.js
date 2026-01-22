
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userModel } from "../Models/UserModel.js";



import crypto from "crypto";
import { sendOTPEmail } from "../utils/sendEmail.js";

export const sendOtpRegister = async (req, res) => {
  const { username, email, password } = req.body;

  const exists = await userModel.findOne({ email });
  if (exists) return res.status(409).json({ message: "User already exists" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const hashedPassword = await bcrypt.hash(password, 10);

  await userModel.create({
    username,
    email,
    password: hashedPassword,
    otp: hashedOtp,
    otpExpires: Date.now() + 10 * 60 * 1000,
  });

  await sendOTPEmail(email, otp);

  res.json({ message: "OTP sent to email" });
};




export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  if (hashedOtp !== user.otp || user.otpExpires < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    message: "Account verified",
    token,
    username: user.username,
  });
};




// --------------------------------------------------------------------------



export const loginUser = async (req, res) => {
  try {
    const { email, username, password, googleId } = req.body;
    // google login
    if (googleId) {
      const user = await userModel.findOne({ email });

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      if (user.googleId !== googleId) {
        return res.status(401).json({
          message: "Invalid Google login"
        });
      }

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
     
      

      return res.status(200).json({
        message: "Google login successful",
        token,
        user
      });
    }

  //  normal login
    const user = await userModel.findOne({
      $or: [{ email }, { username }]
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Please login using Google"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
};


// ----------------------------------------------------------

