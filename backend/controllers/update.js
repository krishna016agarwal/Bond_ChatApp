const bcrypt = require("bcrypt");
const User = require("../models/user");
module.exports.update = async (req, res, next) => {


    try {
       
        
        const id=req.params.id;
        const { username, email, password } = req.body;



  const hashpassword = await bcrypt.hash(password, 10);
        const updatedFields = {};
        if (username !== undefined && username !== "") updatedFields.username = username;
        if (email !== undefined && email !== "" ) updatedFields.email = email;
        if (password !== undefined && password !== "") updatedFields.password = hashpassword;
       
        // Update only username, email, and password (others remain unchanged)
        const result = await User.findByIdAndUpdate(
            id,
            { $set: updatedFields },
            { new: true } // Return the updated document
        );




    if(username=="" && email=="" && password==""){
        return res.json({ status: false, message:"Update fails" });
    }


   
   
    delete result.password;
  
    
      if (result) {
         delete result.password;
        return res.json({ status: true, user: result });
        
      }
    
    } catch (error) {
     
        
        return res.json({ message: "Update fails, please enter unique fileds", status: false });
        
    }
}