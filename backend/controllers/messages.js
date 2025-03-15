const Message = require("../models/message");

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message, time } = req.body;
 

    const data = await Message.create({
      message: { text: message },
      users: [from, to],
      sender: from,
      time: time,
    });
    if (data)
    
      
      return res.json({
        msg: "message added successfully.",
        time: time
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
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        time:msg.time
      };
    });
    res.json(projectMessages);
  } catch (ex) {
  console.log(ex);
  
  }
};
