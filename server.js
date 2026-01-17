



import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";

import connectDB from "./config/dbconfig.js";
import authRoutes from "./Routes/authRoutes.js";
import { router } from "./Routes/userroutes.js";
import { proute } from "./Routes/profileroute.js";
import postrouter from "./Routes/postroute.js";


 import "./config/passport.js";
import notirouter from "./Routes/notificationRouter.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());

app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);

app.use("/api",router)

app.use("/api", proute);

app.use("/api", postrouter)

app.use("/api",notirouter)

app.listen(5000, () => {
    console.log("Backend running on http://localhost:5000");
  });
 
