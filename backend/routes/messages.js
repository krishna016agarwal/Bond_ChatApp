
const { addMessage ,getAllMessages} = require("../controllers/messages")


const msgrouter=require("express").Router()

msgrouter.post("/addmsg/",addMessage)

msgrouter.post("/getmsg/",getAllMessages)



module.exports=msgrouter;

   