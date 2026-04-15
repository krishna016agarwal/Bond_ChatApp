const User = require("../models/user")

module.exports.getAllUsers=async(req,res)=>{
   try {
   const users=await User.find({_id:{$ne:req.params.id}}).select(["email","username","avatarImage","_id","isOnline","lastSeen"])

   const usersWithPresence = users.map((user) => {
    const userObj = user.toObject();
    const userId = String(userObj._id);
    return {
      ...userObj,
      isOnline: global.onlineUsers ? global.onlineUsers.has(userId) : Boolean(userObj.isOnline),
    };
   });

return res.json(usersWithPresence)
   } catch (error) {
    console.log(error)
   } 
}