

import express from "express";
import upload from "../Middlewares/multer.js";
import Verifytoken from "../Middlewares/verifytoken.js";
import { addComment, createPost, deletePost, getAllPosts, getPostById, getUserPosts, likePost } from "../controllers/postcontroller.js";


const postrouter = express.Router();

postrouter.post(
  "/posts",
  Verifytoken,
  upload.single("media"),
  createPost
);


postrouter.get(
  "/posts/user/:userId",
  Verifytoken,
  getUserPosts
);
                
postrouter.get("/posts/:postId", Verifytoken, getPostById);
postrouter.put("/posts/:postId/like", Verifytoken, likePost);
postrouter.post("/posts/:postId/comment", Verifytoken, addComment);
postrouter.delete("/posts/:postId",Verifytoken,deletePost)
// home
postrouter.get("/posts", Verifytoken, getAllPosts)


export default postrouter;
