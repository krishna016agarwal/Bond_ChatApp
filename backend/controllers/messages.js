const Message = require("../models/message");

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message, time, attachment } = req.body;
 

    const data = await Message.create({
      message: { text: message },
      users: [from, to],
      sender: from,
      status: "sent",
      attachment: attachment || undefined,
      seenBy: [from],
      time: time,
    });
    if (data)
    
      
      return res.json({
        msg: "message added successfully.",
        time: time,
        messageId: data._id,
        status: data.status,
      });
  
  } catch (ex) {
    next(ex);
  }
};
module.exports.getAllMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    const messages = await Message.find({
      users: { $all: [from, to] },
    }).sort({ updatedAt: 1 });
    const projectMessages = messages.map((msg) => {
      return {
        _id: msg._id,
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        attachment: msg.attachment || null,
        time: msg.time,
        status: msg.status || "sent",
      };
    });
    res.json(projectMessages);
  } catch (ex) {
  console.log(ex);
  
  }
};

module.exports.addGroupMessage = async (req, res, next) => {
  try {
    const { from, groupId, message, time, attachment } = req.body;

    const data = await Message.create({
      message: { text: message },
      users: [from],
      sender: from,
      status: "sent",
      attachment: attachment || undefined,
      seenBy: [from],
      time,
      chatType: "group",
      group: groupId,
    });

    if (data) {
      return res.json({
        msg: "group message added successfully.",
        time,
        messageId: data._id,
        status: data.status,
      });
    }
  } catch (ex) {
    next(ex);
  }
};

module.exports.getGroupMessages = async (req, res, next) => {
  try {
    const { groupId, currentUserId } = req.body;

    const messages = await Message.find({
      chatType: "group",
      group: groupId,
    })
      .populate("sender", "_id username")
      .populate("seenBy", "_id username")
      .sort({ updatedAt: 1 });

    const projectMessages = messages.map((msg) => ({
      _id: msg._id,
      fromSelf: String(msg.sender?._id) === String(currentUserId),
      senderId: msg.sender?._id,
      senderName: msg.sender?.username || "Unknown",
      message: msg.message.text,
      attachment: msg.attachment || null,
      seenBy: (msg.seenBy || []).map((user) => ({
        _id: user?._id,
        username: user?.username || "Unknown",
      })),
      time: msg.time,
      status: msg.status || "sent",
    }));

    return res.json(projectMessages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.markMessagesRead = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const unreadMessages = await Message.find({
      users: { $all: [from, to] },
      sender: to,
      status: { $ne: "read" },
    }).select(["_id"]);

    const unreadIds = unreadMessages.map((message) => message._id);

    if (unreadIds.length === 0) {
      return res.json({ status: true, updatedIds: [] });
    }

    await Message.updateMany(
      { _id: { $in: unreadIds } },
      {
        $set: {
          status: "read",
          readAt: new Date(),
        },
      }
    );

    return res.json({ status: true, updatedIds: unreadIds });
  } catch (ex) {
    next(ex);
  }
};

module.exports.markGroupMessagesSeen = async (req, res, next) => {
  try {
    const { groupId, userId } = req.body;

    const groupMessages = await Message.find({
      chatType: "group",
      group: groupId,
      sender: { $ne: userId },
      seenBy: { $ne: userId },
    }).select(["_id"]);

    const unreadIds = groupMessages.map((message) => message._id);

    if (unreadIds.length === 0) {
      return res.json({ status: true, updatedIds: [] });
    }

    await Message.updateMany(
      { _id: { $in: unreadIds } },
      {
        $addToSet: { seenBy: userId },
      }
    );

    return res.json({ status: true, updatedIds: unreadIds });
  } catch (ex) {
    next(ex);
  }
};
