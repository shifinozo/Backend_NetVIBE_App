import cloudinary from "../config/cloudinaryconfig.js";
import { Notification } from "../Models/Notificationmodel.js";
import { postModel } from "../Models/postmodel.js";
import { userModel } from "../Models/UserModel.js";
import { io } from "../server.js";

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

    if (isPrivate !== undefined) {
      user.isPrivate = isPrivate === "true";
    }

   
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profilePics" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      user.profilePic = result.secure_url;
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

// ------------------------------------------------------------

export const getMyProfile = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .select("username bio profilePic isPrivate");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
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

      // 🔴 REMOVE FOLLOW NOTIFICATION (DB)
      await Notification.deleteOne({
        type: "follow",
        sender: currentUserId,
        receiver: targetUserId,
      });

      // 🔴 REAL-TIME REMOVE
      io.to(targetUserId).emit("notification-remove", {
        type: "follow",
        sender: currentUserId,
      });

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

        const notification = await Notification.create({
          type: "follow",
          sender: currentUserId,
          receiver: targetUserId,
          isRequest: true,
        });

        const populated = await notification.populate(
          "sender",
          "username profilePic"
        );

        io.to(targetUserId).emit("notification", populated);
      }

      return res.json({ requested: true });
    }

    // ================= PUBLIC ACCOUNT =================
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    const notification = await Notification.create({
      type: "follow",
      sender: currentUserId,
      receiver: targetUserId,
      isRequest: false,
    });

    const populated = await notification.populate(
      "sender",
      "username profilePic"
    );

    // 🟢 REAL-TIME FOLLOW NOTIFICATION
    io.to(targetUserId).emit("notification", populated);

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
    
    await Notification.deleteMany({
      sender: requesterId,
      receiver: currentUserId,
      isRequest: true,
    });

    // 🔴 REALTIME REMOVE REQUEST NOTIFICATION
    io.to(currentUserId).emit("notification-remove", {
      type: "follow",
      sender: requesterId,
    });

    // 3️⃣ CREATE "STARTED FOLLOWING YOU" NOTIFICATION
    const followNotification = await Notification.create({
      type: "follow",
      sender: requesterId,
      receiver: currentUserId,
      isRequest: false,
    });

    const populated = await followNotification.populate(
      "sender",
      "username profilePic"
    );

    // 🟢 REALTIME ADD FOLLOW NOTIFICATION
    io.to(currentUserId).emit("notification", populated);

    // 🟢 OPTIONAL: INFORM REQUESTER (profile UI update)
  
        io.to(requesterId).emit("follow-request-accepted", {
      userId: currentUserId,
    });

  
    res.json({ accepted: true });
  } catch (err) {
    console.error("Accept follow error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// -----------------------------------------------


export const rejectFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const requesterId = req.params.id;

    const currentUser = await userModel.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.followRequests.pull(requesterId);
    await currentUser.save();

    await Notification.deleteMany({
      sender: requesterId,
      receiver: currentUserId,
      isRequest: true,
    });

    // ✅ REMOVE notification for current user
    io.to(currentUserId).emit("notification-remove", {
      type: "follow",
      sender: requesterId,
    });

    // ✅ INFORM REQUESTER (THIS WAS MISSING 🔥)
    io.to(requesterId).emit("follow-request-rejected", {
      userId: currentUserId,
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

const users = await userModel.find({ _id: { $ne: currentUserId } });

const formatted = users.map(u => ({
  ...u.toObject(),
  isFollowing: u.followers
    .map(id => id.toString())
    .includes(currentUserId)
}));

res.json(formatted);

};



