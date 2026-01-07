import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

// STEP 1: Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);


// STEP 2: Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(
      `http://localhost:5173/google-success?token=${token}&username=${req.user.username}`
    );
  }
);

export default router;
