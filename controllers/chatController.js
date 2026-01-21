
import Conversation from "../Models/Conversation.js";
import Message from "../Models/Message.js";
import { userModel } from "../Models/UserModel.js";

import { io } from "../server.js";


export const sendMessage = async (req, res) => {
  const { conversationId, text } = req.body;

  const message = await Message.create({
    conversation: conversationId,
    sender: req.user.id,
    text,
  });

  const populatedMessage = await message.populate(
    "sender",
    "username profilePic"
  );

  // update last message
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
  });

  // 🔥 REAL TIME MESSAGE
  io.to(conversationId).emit("new-message", populatedMessage);

  res.json(populatedMessage);
};


// ---------------------------------------------


export const getMessages = async (req, res) => {
  const messages = await Message.find({
    conversation: req.params.id,
  }).populate("sender", "username profilePic");

  res.json(messages);
};

// ----------------------------------------------------------------
export const getOrCreateConversation = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  console.log("strrddd",currentUserId);
  console.log("srrrttt",userId);
  

  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, userId] },
  }).populate("participants", "username profilePic");

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [currentUserId, userId],
    });
    conversation = await conversation.populate(
      "participants",
      "username profilePic"
    )
  }

  res.json(conversation);
};

// ----------------------------------------------------------------




export const getMyConversations = async (req, res) => {
  const myId = req.user.id;

  const conversations = await Conversation.find({
    participants: myId,
  })
    .populate("participants", "username profilePic followers following isPrivate")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  const formatted = conversations.map((conv) => {
    const otherUser = conv.participants.find(
      (p) => String(p._id) !== String(myId)
    );

    if (!otherUser) return null;

    const iFollow = otherUser.followers.some(
      (id) => String(id) === String(myId)
    );

    const followsMe = otherUser.following.some(
      (id) => String(id) === String(myId)
    );

    let category = "stranger";
    if (iFollow && followsMe) category = "mutual";
    else if (iFollow || followsMe) category = "oneway";

    return {
      _id: conv._id,
      otherUser: {
        _id: otherUser._id,
        username: otherUser.username,
        profilePic: otherUser.profilePic,
        isPrivate: otherUser.isPrivate,
      },
      lastMessage: conv.lastMessage,
      category,
    };
  }).filter(Boolean);

  res.json(formatted);
};



// -----------------------------------------------------------------
// searchuser

export const searchmsguser = async (req, res) => {
  const { q } = req.query;
  const myId = req.user.id;

  if (!q) return res.json([]);

  const users = await userModel.find({
    username: { $regex: q, $options: "i" },
    _id: { $ne: myId },
  }).select("username profilePic followers isPrivate");

  const result = users.filter((u) => {
    if (!u.isPrivate) return true;
    return u.followers.includes(myId);
  });

  res.json(result);
}

