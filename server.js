
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
 
// ----------------------------------------------------------------------------------
  // good one
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
import chatRouter from "./Routes/chatRoutes.js";
import "./config/passport.js";

import Conversation from "./Models/Conversation.js";
import Message from "./Models/Message.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

/* 🔥 SOCKET.IO SETUP */
export const io = new Server(server, {
  cors: {
    // origin: "http://localhost:5173",
    origin: [
  "http://localhost:5173",
  "https://your-frontend.vercel.app"
],

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
app.use("/api/chat", chatRouter);

/* ================= SOCKET LOGIC ================= */

const onlineUsers = new Map(); // userId => socketId

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // 🔹 USER ONLINE
  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);

    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  // 🔹 JOIN CONVERSATION ROOM
  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
  });

  // 🔹 SEND MESSAGE (REAL-TIME)
  socket.on(
    "send-message",
    async ({ conversationId, senderId, text }) => {
      try {
        const message = await Message.create({
          conversation: conversationId,
          sender: senderId,
          text,
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
        });

        const populatedMessage = await message.populate(
          "sender",
          "username profilePic"
        );

        // Emit to conversation room
        io.to(conversationId).emit("new-message", populatedMessage);
      } catch (err) {
        console.error("Message error:", err);
      }
    }
  );

  // 🔴 USER OFFLINE
  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log("🔴 User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

// server.listen(5000, () => {
//   console.log("🚀 Backend running on http://localhost:5000");
// });

