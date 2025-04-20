import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { IoSettingsOutline } from "react-icons/io5";

import style from "./chat.module.css";
import { Contacts } from "./contacts";
import { Home } from "./home";
import Logout from "./logout";
import ChatContainer from "./chatcontainer";
import Setting from "./setting";
import Slidebar from "./slidebar";

export const Chat = () => {
  const socket = useRef();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(undefined);
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [setting, setSetting] = useState(false);

  // Check user in localStorage
  useEffect(() => {
    const checkUser = async () => {
      const user = localStorage.getItem("user");
      if (!user) {
        navigate("/login");
      } else {
        setCurrentUser(JSON.parse(user));
        setIsLoaded(true);
      }
    };
    checkUser();
  }, []);

  // Wake backend on mount (Render cold start fix)
  useEffect(() => {
    const wakeBackend = async () => {
      const backendURL =
        import.meta.env.MODE === "development"
          ? "http://localhost:8000"
          : "https://bond-chatapp-backend.onrender.com";
      try {
        await axios.get(backendURL);
      } catch (err) {
        console.warn("Backend wake-up failed:", err);
      }
    };
    wakeBackend();
  }, []);

  // Setup socket when currentUser is ready
  useEffect(() => {
    if (currentUser) {
      const socketURL =
        import.meta.env.MODE === "development"
          ? "http://localhost:8000"
          : "https://bond-chatapp-backend.onrender.com";

      socket.current = io(socketURL, {
        transports: ["websocket", "polling"],
        withCredentials: true,
      });

      socket.current.emit("add-user", currentUser._id);
    }
  }, [currentUser]);

  // Fetch contacts when currentUser is set
  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          try {
            const apiUrl =
              import.meta.env.MODE === "development"
                ? `http://localhost:8000/api/allUsers/${currentUser._id}`
                : `https://bond-chatapp-backend.onrender.com/api/allUsers/${currentUser._id}`;
            const { data } = await axios.get(apiUrl);
            setContacts(data);
          } catch (error) {
            console.error("Error fetching contacts:", error);
          }
        } else {
          navigate("/setAvatar");
        }
      }
    };
    fetchContacts();
  }, [currentUser]);

  // Handle chat switch
  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    setSetting(false);
  };

  // Toggle settings panel
  const handleSetting = () => {
    setSetting((prev) => !prev);
  };

  return (
    <div className={style.main}>
      <div className={style.container}>
        <div className={style.line}>
          <Slidebar currentChat={currentChat} setCurrentChat={setCurrentChat} />
          <div className={style.cont}>
            <Logout />
            <IoSettingsOutline className={style.setting} onClick={handleSetting} />
          </div>
        </div>

        <Contacts
          contacts={contacts}
          currentUser={currentUser}
          changeChat={handleChatChange}
          setting={setting}
        />

        {setting ? (
          <Setting currentUser={currentUser} />
        ) : currentChat ? (
          <ChatContainer
            currentChat={currentChat}
            currentUser={currentUser}
            socket={socket}
          />
        ) : (
          <Home currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};
