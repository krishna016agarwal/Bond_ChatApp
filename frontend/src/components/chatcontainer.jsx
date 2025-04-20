import React, { useEffect, useState, useRef } from "react";
import style from "./chatcontainer.module.css";
import Chatinput from "./chatinput";
import axios from "axios";
import { v4 as uuid4 } from "uuid";

const ChatContainer = ({ currentChat, currentUser, socket }) => {
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const scrollRef = useRef();
  const [messages, setMessages] = useState([]);

  // Fetch previous messages on currentChat change
  useEffect(() => {
    const fetchMessages = async () => {
      if (currentChat) {
        const response = await axios.post(
          `${import.meta.env.MODE === "development" ? `http://localhost:8000/api/messages/getmsg` : `/api/messages/getmsg`}`,
          {
            from: currentUser._id,
            to: currentChat._id,
          }
        );
        setMessages(response.data);
      }
    };
    fetchMessages();
  }, [currentChat]);

  // Handle sending a new message
  const handleSendMsg = async (message) => {
    const { data } = await axios.post(
      `${import.meta.env.MODE === "development" ? `http://localhost:8000/api/messages/addmsg` : `/api/messages/addmsg`}`,
      {
        from: currentUser._id,
        to: currentChat._id,
        message,
        time: new Date(Date.now()).toLocaleString("en-IN"),
      }
    );

    // Emit the message to socket server
    socket.current.emit("send-msg", {
      to: currentChat._id,
      from: currentUser._id,
      message: message,
      time: data.time,
    });

    // Add the sent message to the state
    setMessages((prevMessages) => [
      ...prevMessages,
      { fromSelf: true, message, time: data.time },
    ]);
  };

  // Listen for incoming messages
  useEffect(() => {
    if (socket.current) {
      socket.current.on("receive-msg", (msg) => {
        // Use the properties from the msg object received
        setArrivalMessage({
          fromSelf: false,
          message: msg.message, // Assuming msg contains the message content
          time: msg.time, // Assuming msg contains the time
        });
      });

      // Cleanup the event listener when the component unmounts
      return () => {
        socket.current.off("receive-msg");
      };
    }
  }, [socket.current]);

  // Update messages with the arrival message
  useEffect(() => {
    if (arrivalMessage) {
      setMessages((prevMessages) => [...prevMessages, arrivalMessage]);
    }
  }, [arrivalMessage]);

  // Scroll to the latest message when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


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
                />
              </div>
              <div className={style.username}>
                <h3>{currentChat.username}</h3>
              </div>
            </div>
          </div>
          <div className={style.chat_messages}>
            {messages.map((message) => {
              const date = message.time;
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
          <Chatinput handleSendMsg={handleSendMsg} />
        </div>
      )}
    </>
  );
};

export default ChatContainer;
