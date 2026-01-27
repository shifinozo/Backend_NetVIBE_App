
// -------------------------------------------------------------------------
import cloudinary from "../config/cloudinaryconfig.js";
import { Notification } from "../Models/Notificationmodel.js";
import { postModel } from "../Models/postmodel.js";
import { userModel } from "../Models/UserModel.js";

import { io } from "../server.js"



export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Media is required" });
    }

    cloudinary.uploader
      .upload_stream({ folder: "posts" }, async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Upload failed" });
        }

        const post = await postModel.create({
          user: userId,
          media: result.secure_url,
          caption: caption || "",
        });

        await userModel.findByIdAndUpdate(userId, {
          $push: { posts: post._id },
        });

        res.status(201).json(post);
      })
      .end(req.file.buffer);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getUserPosts = async (req, res) => {
  try {
    const posts = await postModel
      .find({ user: req.params.userId })
      .populate("user", "username profilePic")
      .populate("likes", "username")
      .populate("comments.user", "username profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};





export const getPostById = async (req, res) => {
  try {
    const post = await postModel
      .findById(req.params.postId)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(200).json(post);
   
    
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// -------------------------------------------------------------

export const likePost = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.postId);
    const userId = req.user.id;

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // 🔴 UNLIKE
      post.likes.pull(userId);

      // ✅ DELETE LIKE NOTIFICATION
      await Notification.findOneAndDelete({
        type: "like",
        sender: userId,
        receiver: post.user,
        post: post._id,
      });
     
      io.to(post.user.toString()).emit("notification-remove", {
        type: "like",
        sender: userId,
        post: post._id.toString(),
      });

    } else {
      // 🟢 LIKE
      post.likes.push(userId);

      if (post.user.toString() !== userId) {
        // ✅ PREVENT DUPLICATE NOTIFICATION
        const existing = await Notification.findOne({
          type: "like",
          sender: userId,
          receiver: post.user,
          post: post._id,
        });

        if (!existing) {
          const notification = await Notification.create({
            type: "like",
            sender: userId,
            receiver: post.user,
            post: post._id,
          });
          const populatedNotification = await notification.populate(
            "sender",
            "username profilePic"
          );

          await populatedNotification.populate("post", "media");

          io.to(post.user.toString()).emit("notification", populatedNotification);
        }
        
      }
    }

    await post.save();

    const updatedPost = await postModel
      .findById(post._id)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic");

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Like post error:", err);
    res.status(500).json({ message: "Failed to update like" });
  }
};

// ------------------------------------------------------


export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({ user: userId, text });
    await post.save();

    let notification = null;

    // 🚫 prevent self notification
    if (post.user.toString() !== userId) {
      notification = await Notification.create({
        type: "comment",
        sender: userId,
        receiver: post.user,
        post: post._id,
      });

      // ✅ populate before emit
      notification = await notification.populate(
        "sender",
        "username profilePic"
      );

      notification = await notification.populate(
        "post",
        "media"
      );

      // 🔔 REAL-TIME COMMENT NOTIFICATION
      io.to(post.user.toString()).emit("notification", notification);
    }

    const updatedPost = await postModel.findById(postId)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic");

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

// -------------------------------------------------------------------------


export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isCommentOwner = comment.user.toString() === userId;
    const isPostOwner = post.user.toString() === userId;

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 🗑 delete comment
    comment.deleteOne();
    await post.save();


    // find notification FIRST
      const notification = await Notification.findOne({
        type: "comment",
        sender: comment.user,
        receiver: post.user,
        post: post._id,
      });

      if (notification) {
        await notification.deleteOne();

        io.to(post.user.toString()).emit("notification-remove", {
          type: "comment",
          sender: comment.user.toString(),
          post: post._id.toString(),
        });
      }


    const updatedPost = await postModel.findById(postId)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic");

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};



// ------------------------------------------------------------------------


export const deletePost = async (req, res) => {
  try {
    console.log("reached");
    
    const post = await postModel.findById(req.params.postId);
    console.log("postt",post);
    

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

   
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

   
    await userModel.findByIdAndUpdate(req.user.id, {
      $pull: { posts: post._id },
    });

    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// ----------------------------------------------------------------
// home page


export const getAllPosts = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const currentUser = await userModel
      .findById(currentUserId)
      .select("following");

    const posts = await postModel
      .find()
      .populate("user", "username profilePic isPrivate followers")
      .populate("comments.user", "username profilePic")
      .sort({ createdAt: -1 });

    const validPosts = posts.filter(post => post.user);

    const visiblePosts = validPosts
      .filter(post => {

        if (!post.user.isPrivate) return true;

        return currentUser.following
          .map(id => id.toString())
          .includes(post.user._id.toString());
      })
      .map(post => ({
        ...post.toObject(),
        isOwner: post.user._id.toString() === currentUserId,
        comments: post.comments.filter(c => c.user), 
      }));

    res.json(visiblePosts);
  } catch (error) {
    console.error("Fetch posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


