



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
 

// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import passport from "passport";
// import http from "http";
// import { Server } from "socket.io";

// import connectDB from "./config/dbconfig.js";
// import authRoutes from "./Routes/authRoutes.js";
// import { router } from "./Routes/userroutes.js";
// import { proute } from "./Routes/profileroute.js";
// import postrouter from "./Routes/postroute.js";

// import "./config/passport.js";

// dotenv.config();
// connectDB();

// const app = express();

// /* ---------------- MIDDLEWARE ---------------- */
// app.use(cors({
//   origin: "http://localhost:5173", // frontend URL
//   credentials: true
// }));

// app.use(express.json());
// app.use(passport.initialize());

// /* ---------------- ROUTES ---------------- */
// app.use("/api/auth", authRoutes);
// app.use("/api", router);
// app.use("/api", proute);
// app.use("/api", postrouter);

// /* ---------------- SOCKET SETUP ---------------- */
// const server = http.createServer(app);

// export const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST", "PUT", "DELETE"]
//   }
// });

// io.on("connection", (socket) => {
//   console.log("🟢 Socket connected:", socket.id);

//   socket.on("joinPost", (postId) => {
//     socket.join(postId);
//     console.log(`📌 Joined post room: ${postId}`);
//   });

//   socket.on("disconnect", () => {
//     console.log("🔴 Socket disconnected:", socket.id);
//   });
// });

// /* ---------------- START SERVER ---------------- */
// server.listen(5000, () => {
//   console.log("🚀 Backend running on http://localhost:5000");
// });
