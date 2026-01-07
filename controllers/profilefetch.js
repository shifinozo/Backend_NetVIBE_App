import cloudinary from "../config/cloudinaryconfig.js";
import { postModel } from "../Models/postmodel.js";
import { userModel } from "../Models/UserModel.js";

export const GetUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await userModel
      .findOne({ username })
      .select("-password -googleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const postsCount = await postModel.countDocuments({
      user: user._id,
    });

    res.status(200).json({
      user: {
        _id: user._id,
        username: user.username,
        profilePic: user.profilePic,
        bio: user.bio,
      },
      stats: {
        posts: postsCount,
        followers: user.followers.length,
        following: user.following.length,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// -------------------------------------------------------------------------------------

export const editProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, bio, isPrivate } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

   
    if (username) user.username = username;
    if (bio) user.bio = bio;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;

    // profile pic add cheyyaan
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload_stream(
        { folder: "profilePics" },
        async (error, result) => {
          if (error) {
            return res.status(500).json({ message: "Image upload failed" });
          }

          user.profilePic = result.secure_url;
          await user.save();

          return res.status(200).json({
            message: "Profile updated successfully",
            user,
          });
        }
      );

      uploadResult.end(req.file.buffer);
      return;
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Edit profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ----------------------------------------------------------


export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}).select("_id username profilePic bio");

    res.status(200).json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
