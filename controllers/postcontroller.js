
// -------------------------------------------------------------------------
import cloudinary from "../config/cloudinaryconfig.js";
import { postModel } from "../Models/postmodel.js";
import { userModel } from "../Models/UserModel.js";

// import { io } from "../server.js";



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


// export const likePost = async (req, res) => {
//   try {
//     const post = await postModel.findById(req.params.postId);
//     const userId = req.user.id;

//     if (post.likes.includes(userId)) {
//       post.likes.pull(userId);
//     } else {
//       post.likes.push(userId);
//     }

//     await post.save();
//     const updatedPost = await postModel.findById(req.params.postId)
//       .populate("user", "username profilePic")
//       .populate("comments.user", "username");
//     res.status(200).json(updatedPost);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to update like" });
//   }
// };

export const likePost = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.postId);
    const userId = req.user.id;

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    let liked;

    if (post.likes.includes(userId)) {
      // Unlike
      post.likes.pull(userId);
      liked = false;
    } else {
      // Like
      post.likes.push(userId);
      liked = true;

      if (post.user.toString() !== userId) {
        await Notification.create({
          type: "like",
          sender: userId,
          receiver: post.user,
          post: post._id,
        });
      }
    }

    await post.save();
    const updatedPost = await postModel.findById(req.params.postId)
      .populate("user", "username profilePic")
      .populate("comments.user", "username");

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Like post error:", err);
    res.status(500).json({ message: "Failed to update like" });
  }
};


// export const addComment = async (req, res) => {
//   try {
//     const { text } = req.body;
//     const post = await postModel.findById(req.params.postId);
//     const userId = req.user.id;

//     post.comments.push({ user: userId, text });
//     await post.save();

//     const updatedPost = await postModel.findById(req.params.postId)
//       .populate("user", "username profilePic")
//       .populate("comments.user", "username");

//     res.status(200).json(updatedPost);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to add comment" });
//   }
// };

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.postId; 
    const userId = req.user.id;

    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = { user: userId, text };
    post.comments.push(comment);
    await post.save();

    if (post.user.toString() !== userId) {
      await Notification.create({
        type: "comment",
        sender: userId,
        receiver: post.user,
        post: post._id,
      });
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



// with socket io
// export const addComment = async (req, res) => {
//   try {
//     const post = await postModel.findById(req.params.postId);

//     const newComment = {
//       user: req.user.id,
//       text: req.body.text,
//     };

//     post.comments.push(newComment);
//     await post.save();

//     const populatedPost = await postModel
//       .findById(post._id)
//       .populate("comments.user", "username profilePic");

//     // 🔥 REAL-TIME EMIT
//     io.to(post._id.toString()).emit("newComment", {
//       postId: post._id,
//       comment: populatedPost.comments.at(-1),
//     });

//     res.status(200).json(populatedPost);
//   } catch (err) {
//     res.status(500).json({ message: "Comment failed" });
//   }
// };



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
  const posts = await postModel
    .find()
    .populate("user", "username profilePic")
    .populate("comments.user", "username")
    .sort({ createdAt: -1 });

  res.json(posts);
};