import React, { useEffect, useState,useRef } from "react";
import style from "./chatcontainer.module.css";

import Chatinput from "./chatinput";

import axios from "axios";
import {v4 as uuid4} from "uuid"





const ChatContainer = ({ currentChat, currentUser,socket }) => {
  
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const scrollRef=useRef();
  const [messages, setMessages] = useState([]);


  
  useEffect( ()=>{
    const Msg=async()=>{
    if(currentChat){
    const response = await axios.post(
      "http://localhost:8000/api/messages/getmsg",
      {
        from: currentUser._id,
        to: currentChat._id,
      }
    );
 
    
    setMessages(response.data);
  
  }}
Msg();
}, [currentChat]);

  const handleSendMsg = async (message) => {
    const { data } = await axios.post(
      "http://localhost:8000/api/messages/addmsg",
      {
        from: currentUser._id,
        to: currentChat._id,
        message,
        time:(new Date(Date.now()).toLocaleString('en-IN'))
      }
    );
 

 
    
    socket.current.emit("send-msg", { to: currentChat._id, from: currentUser._id,message:message,time:data.time })
    const msgs=[...messages];
  
    
    
    msgs.push({fromSelf:true,message:message,time:data.time})
    setMessages(msgs)
  };
  useEffect(() => {
    if(socket.current){
      socket.current.on("receive-msg", (msg) => {
    
        
setArrivalMessage({fromSelf:false,message:msg,time:data.time})
      })
    }
  },[]);
useEffect(()=>{
  arrivalMessage && setMessages((prev)=>{[...prev,arrivalMessage]})
},[arrivalMessage])
useEffect(()=>{
  scrollRef.current?.scrollIntoView({behaviour:"smooth"})
},[messages])
  return (
    <>
      {currentChat && (
        <div className={style.main}>
          <div className={style.header}>
            <div className={style.user}>
              <div className={style.avatar}>
                <img
                  src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
                  alt="avatar"
                ></img>
              </div>
              <div className={style.username}>
                <h3>{currentChat.username}</h3>
              </div>
            </div>
         
          </div>      
          <div className={style.chat_messages}>
         
      
            {messages.map((message) => {
            
             const date=message.time
             
              return (
                <div ref={scrollRef} key={uuid4()}>
                  <div
                    className={`${style.message} ${
                      message.fromSelf ? `${style.sended}` : `${style.received}`
                    }`}
                  >
                   <div className={style.note}>
                   <p>{date}</p>
                    <div className={style.content}>
                      
                      <p>{message.message}</p>
                     
                    </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Chatinput handleSendMsg={handleSendMsg}></Chatinput>
        </div>
      )}
    </>
  );
};
export default ChatContainer;
