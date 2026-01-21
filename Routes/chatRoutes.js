import express from "express";
import Verifytoken from "../Middlewares/verifytoken.js";
import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  getMyConversations,
  searchmsguser,
 
} from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.post("/message", Verifytoken, sendMessage);
chatRouter.get("/conversations", Verifytoken, getMyConversations);
chatRouter.get("/conversation/:userId", Verifytoken, getOrCreateConversation);
chatRouter.get("/messages/:id", Verifytoken, getMessages);

chatRouter.get("/search-users", Verifytoken,searchmsguser)


export default chatRouter;
