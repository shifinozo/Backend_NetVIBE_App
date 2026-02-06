import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const authRoutes = express.Router();

// STEP 1: Redirect to Google
authRoutes.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);


// STEP 2: Google callback
authRoutes.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(
      `https://frontend-net-vibe-app.vercel.app/google-success?token=${token}&username=${req.user.username}&userId=${req.user._id}`
    );

  }
);

export default authRoutes;
