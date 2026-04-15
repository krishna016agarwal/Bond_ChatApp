const express =require("express");

const app = express();

require("dotenv").config();

const port = process.env.PORT || 3000;

const mongoose = require("mongoose");

const cors = require("cors");
const router = require("./routes/user");
const msgrouter = require("./routes/messages");
const grouprouter = require("./routes/groups");
const User = require("./models/user");
const Message = require("./models/message");
const Group = require("./models/group");

const socket = require("socket.io");


const path= require("path")
const _dirname=path.resolve();









app.use(express.json({ limit: "10mb" }));  // Increase the limit
app.use(express.urlencoded({ limit: "10mb", extended: true }));


app.use(
  cors({
    origin:["http://localhost:5173", process.env.FRONTEND_URL],
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

try {
  mongoose.connect(process.env.MONGODB).then(() => {
    console.log("mongodb connected");
  });
} catch (error) {
  console.log("mongodb connection error : ", error);
}



app.use("/api", router);
app.use("/api/messages", msgrouter);
app.use("/api/groups", grouprouter);











const server=app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

global.onlineUsers = new Map();       
const userSockets = new Map();
const socketToUser = new Map();

const setUserOffline = async (userId) => {
  userSockets.delete(userId);
  onlineUsers.delete(userId);

  const lastSeen = new Date();
  await User.findByIdAndUpdate(userId, {
    isOnline: false,
    lastSeen,
  }).catch((error) => {
    console.log("presence update error:", error);
  });

  io.emit("presence-update", {
    userId,
    isOnline: false,
    lastSeen,
  });
};

const emitToUserSockets = (userId, event, payload) => {
  const sockets = userSockets.get(String(userId));
  if (!sockets || sockets.size === 0) return;

  sockets.forEach((socketId) => {
    io.to(socketId).emit(event, payload);
  });
};

const io = socket(server, {
  cors: {
    origin: [ process.env.FRONTEND_URL,"http://localhost:5173", "https://bond-chatapp.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});



io.on("connection", (socket) => {
  global.chatSocket = socket;

  socket.on("get-online-users", () => {
    socket.emit("online-users", Array.from(userSockets.keys()));
  });
  
  
  socket.on("add-user", async (userId) => {
    if (!userId) return;

    const userIdStr = String(userId);
    onlineUsers.set(userIdStr, socket.id);
    socketToUser.set(socket.id, userIdStr);

    if (!userSockets.has(userIdStr)) {
      userSockets.set(userIdStr, new Set());
    }
    userSockets.get(userIdStr).add(socket.id);

    await User.findByIdAndUpdate(userIdStr, {
      isOnline: true,
    }).catch((error) => {
      console.log("presence update error:", error);
    });

    io.emit("presence-update", {
      userId: userIdStr,
      isOnline: true,
      lastSeen: null,
    });

    socket.emit("online-users", Array.from(userSockets.keys()));
  });

  socket.on("set-offline", async (userId) => {
    const userIdStr = String(userId || "");
    if (!userIdStr) return;

    socketToUser.delete(socket.id);

    const sockets = userSockets.get(userIdStr);
    if (!sockets) return;

    sockets.delete(socket.id);
    if (sockets.size === 0) {
      await setUserOffline(userIdStr);
    }
  });

  socket.on("send-msg", async (data) => {
    const toUserId = String(data.to || "");
    const fromUserId = String(data.from || "");
    const messageId = data.messageId;
    const receiverSockets = userSockets.get(toUserId);

    if (receiverSockets && receiverSockets.size > 0) {
      receiverSockets.forEach((socketId) => {
        io.to(socketId).emit("receive-msg", data);
      });

      if (messageId) {
        await Message.findByIdAndUpdate(messageId, {
          status: "delivered",
          deliveredAt: new Date(),
        }).catch((error) => {
          console.log("message delivery update error:", error);
        });

        emitToUserSockets(fromUserId, "message-delivered", {
          messageId,
        });
      }
    }
  });

  socket.on("message-read", async ({ messageId, to }) => {
    if (!messageId) return;

    await Message.findByIdAndUpdate(messageId, {
      status: "read",
      readAt: new Date(),
    }).catch((error) => {
      console.log("message read update error:", error);
    });

    emitToUserSockets(String(to || ""), "message-read", { messageId });
  });

  socket.on("message-delivered", async ({ messageId, to }) => {
    if (!messageId) return;

    await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          status: "delivered",
          deliveredAt: new Date(),
        },
      },
      { new: false }
    ).catch((error) => {
      console.log("message delivered update error:", error);
    });

    emitToUserSockets(String(to || ""), "message-delivered", { messageId });
  });

  socket.on("messages-read", async ({ messageIds, to }) => {
    if (!Array.isArray(messageIds) || messageIds.length === 0) return;

    await Message.updateMany(
      { _id: { $in: messageIds } },
      {
        $set: {
          status: "read",
          readAt: new Date(),
        },
      }
    ).catch((error) => {
      console.log("bulk read update error:", error);
    });

    emitToUserSockets(String(to || ""), "message-read-bulk", { messageIds });
  });

  socket.on("send-group-msg", async (data) => {
    const { groupId, from } = data;
    if (!groupId || !from) return;

    const group = await Group.findById(groupId).select(["members"]);
    if (!group) return;

    const recipients = group.members
      .map((memberId) => String(memberId))
      .filter((memberId) => memberId !== String(from));

    recipients.forEach((memberId) => {
      emitToUserSockets(memberId, "receive-group-msg", data);
    });
  });

  socket.on("group-messages-seen", async ({ groupId, userId, userName, messageIds }) => {
    if (!groupId || !userId || !Array.isArray(messageIds) || messageIds.length === 0) return;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        chatType: "group",
        group: groupId,
      },
      {
        $addToSet: {
          seenBy: userId,
        },
      }
    ).catch((error) => {
      console.log("group seen update error:", error);
    });

    const group = await Group.findById(groupId).select(["members"]);
    if (!group) return;

    const recipients = group.members
      .map((memberId) => String(memberId))
      .filter((memberId) => memberId !== String(userId));

    recipients.forEach((memberId) => {
      emitToUserSockets(memberId, "group-messages-seen", {
        groupId,
        userId,
        userName,
        messageIds,
      });
    });
  });

  socket.on("disconnect", async () => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    socketToUser.delete(socket.id);

    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        await setUserOffline(userId);
      }
    }
  });
});