





import React from "react";
import style from "./chat.module.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Contacts } from "./contacts";
import { Home } from "./home";
import Logout from "./logout";
import axios from "axios";
import ChatContainer from "./chatcontainer";
import { io } from "socket.io-client";
import Setting from "./setting";
import { IoSettingsOutline } from "react-icons/io5";
import Slidebar from "./slidebar";

export const Chat = () => {
  const socket = useRef();
  const [currentChat, setCurrentChat] = useState(undefined);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoadded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [setting, setSetting] = useState(false);

  const navigate = useNavigate();

  // Function to fetch contacts
  const fetchContacts = async () => {
    if (currentUser) {
      if (currentUser.isAvatarImageSet) {
        try {
          const data = await axios.get(
            `${   import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/allUsers/${currentUser._id}`
          );
          setContacts(data.data);
          setCurrentChat((prevCurrentChat) => {
            if (!prevCurrentChat) return prevCurrentChat;
            const updatedCurrentChat = data.data.find(
              (contact) => String(contact._id) === String(prevCurrentChat._id)
            );
            return updatedCurrentChat || prevCurrentChat;
          });
        } catch (error) {
          console.error("Error fetching contacts:", error);
        }
      } else {
        navigate("/setAvatar");
      }
    }
  };

  const fetchGroups = async () => {
    if (!currentUser) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/groups/${currentUser._id}`
      );

      const groupsData = response?.data?.groups || [];
      const normalizedGroups = groupsData.map((group) => ({
        ...group,
        chatType: "group",
        isGroup: true,
        username: group.name,
      }));

      setGroups(normalizedGroups);

      setCurrentChat((prevCurrentChat) => {
        if (!prevCurrentChat || !prevCurrentChat.isGroup) return prevCurrentChat;

        const updatedGroup = normalizedGroups.find(
          (group) => String(group._id) === String(prevCurrentChat._id)
        );

        return updatedGroup || prevCurrentChat;
      });
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  // Socket setup after user is set
  useEffect(() => {
    if (currentUser) {
      const socketURL =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"; // For production URL
      socket.current = io(socketURL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      socket.current.on("connect", () => {
        socket.current.emit("add-user", currentUser._id);
        socket.current.emit("get-online-users");
      });

      socket.current.on("reconnect", () => {
        socket.current.emit("add-user", currentUser._id);
        socket.current.emit("get-online-users");
      });

      socket.current.on("presence-update", ({ userId, isOnline, lastSeen }) => {
        const normalizedId = String(userId);
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            String(contact._id) === normalizedId
              ? { ...contact, isOnline, lastSeen }
              : contact
          )
        );

        setCurrentChat((prevCurrentChat) => {
          if (!prevCurrentChat || String(prevCurrentChat._id) !== normalizedId) {
            return prevCurrentChat;
          }

          return {
            ...prevCurrentChat,
            isOnline,
            lastSeen,
          };
        });
      });

      socket.current.on("online-users", (onlineUserIds) => {
        const onlineSet = new Set((onlineUserIds || []).map((id) => String(id)));
        setContacts((prevContacts) =>
          prevContacts.map((contact) => ({
            ...contact,
            isOnline: onlineSet.has(String(contact._id)),
          }))
        );
      });

      const markOffline = () => {
        socket.current?.emit("set-offline", currentUser._id);
      };

      window.addEventListener("beforeunload", markOffline);

      return () => {
        markOffline();
        window.removeEventListener("beforeunload", markOffline);
        socket.current.off("connect");
        socket.current.off("reconnect");
        socket.current.off("presence-update");
        socket.current.off("online-users");
        socket.current.disconnect();
      };
    }
  }, [currentUser]);

  // Fetch contacts on currentUser change
  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const intervalId = setInterval(() => {
      fetchContacts();
      fetchGroups();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [currentUser]);

  // Check localStorage for user and set state
  const checkUser = async () => {
    if (!localStorage.getItem("user")) {
      navigate("/login");
    } else {
      setCurrentUser(await JSON.parse(localStorage.getItem("user")));
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  // Handle chat change
  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    setSetting(false); // Hide settings when a chat is selected
  };

  const handleGroupUpdated = (updatedGroup) => {
    if (!updatedGroup) {
      fetchGroups();
      return;
    }

    const normalizedGroup = {
      ...updatedGroup,
      chatType: "group",
      isGroup: true,
      username: updatedGroup.name,
    };

    setGroups((prevGroups) => {
      const exists = prevGroups.some(
        (group) => String(group._id) === String(normalizedGroup._id)
      );

      if (exists) {
        return prevGroups.map((group) =>
          String(group._id) === String(normalizedGroup._id) ? normalizedGroup : group
        );
      }

      return [normalizedGroup, ...prevGroups];
    });

    setCurrentChat((prevCurrentChat) => {
      if (!prevCurrentChat) return prevCurrentChat;
      return String(prevCurrentChat._id) === String(normalizedGroup._id)
        ? normalizedGroup
        : prevCurrentChat;
    });
  };

  const handleGroupDeleted = (groupId) => {
    setGroups((prevGroups) =>
      prevGroups.filter((group) => String(group._id) !== String(groupId))
    );

    setCurrentChat((prevCurrentChat) => {
      if (!prevCurrentChat) return prevCurrentChat;
      return String(prevCurrentChat._id) === String(groupId) ? undefined : prevCurrentChat;
    });
  };

  // Toggle setting visibility
  let button = false;
  const handleSetting = () => {
    button = !button;
    setSetting(button);
  };

  return (
    <>
      <div className={style.main}>
        <div className={style.container}>
          <div className={style.line}>
            <Slidebar
              currentChat={currentChat}
              setCurrentChat={setCurrentChat}
              contacts={contacts}
              groups={groups}
              currentUser={currentUser}
              onGroupUpdated={handleGroupUpdated}
            ></Slidebar>
            <div className={style.cont}>
              <Logout></Logout>
              <IoSettingsOutline className={style.setting} onClick={handleSetting} />
            </div>
          </div>

          <Contacts
            contacts={contacts}
            groups={groups}
            currentUser={currentUser}
            changeChat={handleChatChange}
            setting={setting}
            onGroupUpdated={handleGroupUpdated}
          ></Contacts>

          {setting ? (
            <Setting currentUser={currentUser}></Setting>
          ) : currentChat ? (
            <ChatContainer
              currentChat={currentChat}
              currentUser={currentUser}
              contacts={contacts}
              socket={socket}
              onGroupUpdated={handleGroupUpdated}
              onGroupDeleted={handleGroupDeleted}
            ></ChatContainer>
          ) : (
            <Home currentUser={currentUser}></Home>
          )}
        </div>
      </div>
    </>
  );
};
