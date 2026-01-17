



// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import passport from "passport";

// import connectDB from "./config/dbconfig.js";
// import authRoutes from "./Routes/authRoutes.js";
// import { router } from "./Routes/userroutes.js";
// import { proute } from "./Routes/profileroute.js";
// import postrouter from "./Routes/postroute.js";


//  import "./config/passport.js";
// import notirouter from "./Routes/notificationRouter.js";

// dotenv.config();
// connectDB();

// const app = express();

// app.use(cors());

// app.use(express.json());
// app.use(passport.initialize());

// app.use("/api/auth", authRoutes);

// app.use("/api",router)

// app.use("/api", proute);

// app.use("/api", postrouter)

// app.use("/api",notirouter)

// app.listen(5000, () => {
//     console.log("Backend running on http://localhost:5000");
//   });
 
// -------------------------------------------------------------------------------------------

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/dbconfig.js";
import authRoutes from "./Routes/authRoutes.js";
import { router } from "./Routes/userroutes.js";
import { proute } from "./Routes/profileroute.js";
import postrouter from "./Routes/postroute.js";
import notirouter from "./Routes/notificationRouter.js";
import "./config/passport.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

/* 🔥 SOCKET.IO SETUP */
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // your frontend
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api", router);
app.use("/api", proute);
app.use("/api", postrouter);
app.use("/api", notirouter);

/* 🔌 SOCKET CONNECTION */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId); // room = userId
  });


  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});



server.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
