
const { addMessage ,getAllMessages, markMessagesRead, addGroupMessage, getGroupMessages, markGroupMessagesSeen } = require("../controllers/messages")


const msgrouter=require("express").Router()

msgrouter.post("/addmsg/",addMessage)

msgrouter.post("/getmsg/",getAllMessages)

msgrouter.post("/mark-read/",markMessagesRead)

msgrouter.post("/add-group-msg/",addGroupMessage)

msgrouter.post("/get-group-msg/",getGroupMessages)

msgrouter.post("/mark-group-seen/",markGroupMessagesSeen)



module.exports=msgrouter;

   