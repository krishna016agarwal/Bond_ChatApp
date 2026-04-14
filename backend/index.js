const express =require("express");

const app = express();

require("dotenv").config();

const port = process.env.PORT || 3000;

const mongoose = require("mongoose");

const cors = require("cors");
const router = require("./routes/user");
const msgrouter = require("./routes/messages");

const socket = require("socket.io");


const path= require("path")
const _dirname=path.resolve();









app.use(express.json({ limit: "10mb" }));  // Increase the limit
app.use(express.urlencoded({ limit: "10mb", extended: true }));


app.use(
  cors({
    origin:["http://localhost:5173", process.env.FRONTEND_URL],
    methods: ["GET","POST"],
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











const server=app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

global.onlineUsers = new Map();       
const io = socket(server, {
  cors: {
    origin: [ process.env.FRONTEND_URL,"http://localhost:5173", "https://bond-chatapp.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});



io.on("connection", (socket) => {
  global.chatSocket = socket;
  
  
  socket.on("add-user", (userId) => {
    
    
    onlineUsers.set( userId,socket.id,);
  
   
    
  });
  socket.on("send-msg", (data) => {
 
 
  
    const sendUserSocket = onlineUsers.get(data.to);
    
    
    if (sendUserSocket) {
     
      
      socket.to(sendUserSocket).emit("receive-msg", data);
    
      
    }
  });
});