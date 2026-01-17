import cloudinary from "../config/cloudinaryconfig.js";
import { Notification } from "../Models/Notificationmodel.js";
import { postModel } from "../Models/postmodel.js";
import { userModel } from "../Models/UserModel.js";

export const UserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    console.log(username);
    

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

    // 🔥 MAIN FIX
    if (isPrivate !== undefined) {
      user.isPrivate = isPrivate === "true";
    }

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
// ----------------------------------------------------

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await userModel
      .findById(userId)
      .select("-password")
      .populate("followers", "_id")
      .populate("following", "_id")
      .populate("followRequests", "_id");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ----------------------------------------------------------



export const followUnfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await userModel.findById(targetUserId);
    const currentUser = await userModel.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following
      .map(id => id.toString())
      .includes(targetUserId);

    // ================= UNFOLLOW =================
    if (isFollowing) {
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);

      await currentUser.save();
      await targetUser.save();

      return res.json({ following: false });
    }

    // ================= PRIVATE ACCOUNT =================
    if (targetUser.isPrivate) {
      const alreadyRequested = targetUser.followRequests
        .map(id => id.toString())
        .includes(currentUserId);

      if (!alreadyRequested) {
        targetUser.followRequests.push(currentUserId);
        await targetUser.save();

        await Notification.create({
          type: "follow",
          sender: currentUserId,
          receiver: targetUserId,
          isRequest: true,
        });
      }

      return res.json({ requested: true });
    }

    // ================= PUBLIC ACCOUNT =================
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    await Notification.create({
      type: "follow",
      sender: currentUserId,
      receiver: targetUserId,
      isRequest: false,
    });

    return res.json({ following: true });

  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ---------------------------------------------------------------

  export const acceptFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const requesterId = req.params.id;

    const currentUser = await userModel.findById(currentUserId);
    const requester = await userModel.findById(requesterId);

    if (!currentUser || !requester) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.followRequests.pull(requesterId);
    currentUser.followers.push(requesterId);
    requester.following.push(currentUserId);

    await currentUser.save();
    await requester.save();

    // ✅ DELETE FOLLOW REQUEST NOTIFICATION
    await Notification.deleteMany({
      sender: requesterId,
      receiver: currentUserId,
      isRequest: true,
    });

    res.json({ accepted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// -----------------------------------------------

export const rejectFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const requesterId = req.params.id;

    const currentUser = await userModel.findById(currentUserId);

    currentUser.followRequests.pull(requesterId);
    await currentUser.save();

    // ✅ DELETE FOLLOW REQUEST NOTIFICATION
    await Notification.deleteMany({
      sender: requesterId,
      receiver: currentUserId,
      isRequest: true,
    });

    res.json({ rejected: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// ---------------------------------------------

export const searchUsers = async (req, res) => {
  const currentUserId = req.user.id;

  const users = await userModel.find(
    { _id: { $ne: currentUserId } },
    "username profilePic followers"
  );

  const result = users.map(user => ({
    _id: user._id,
    username: user.username,
    profilePic: user.profilePic,
    isFollowing: user.followers.includes(currentUserId),
  }));

  res.json(result);
};



