const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    message: {
      text: {
        type: String,
        require: true,
      },
    },
      users: Array,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
      },
      chatType: {
        type: String,
        enum: ["direct", "group"],
        default: "direct",
      },
      group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        default: null,
      },
      attachment: {
        fileName: {
          type: String,
          default: "",
        },
        fileUrl: {
          type: String,
          default: "",
        },
        fileType: {
          type: String,
          enum: ["", "image", "pdf"],
          default: "",
        },
        mimeType: {
          type: String,
          default: "",
        },
      },
      seenBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
      },
      deliveredAt: {
        type: Date,
        default: null,
      },
      readAt: {
        type: Date,
        default: null,
      },
      time: {
        type: String,
       
    },
    },
  
  { timestamps: true }
);

const Message = mongoose.model("Messages", messageSchema);
module.exports = Message;
