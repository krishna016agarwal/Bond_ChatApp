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
      time: {
        type: String,
       
    },
    },
  
  { timestamps: true }
);

const Message = mongoose.model("Messages", messageSchema);
module.exports = Message;
