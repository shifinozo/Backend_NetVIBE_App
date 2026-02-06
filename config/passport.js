import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { userModel } from "../Models/UserModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === "production"
        ? "https://backend-netvibe-app-main.onrender.com/api/auth/google/callback"
        : "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userModel.findOne({ googleId: profile.id });

        if (!user) {
          user = await userModel.create({
            googleId: profile.id,
            username: profile.displayName.replace(/\s/g, "").toLowerCase(),
            email: profile.emails[0].value,
            profilePic: profile.photos[0].value,
          });
        }

        return done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
