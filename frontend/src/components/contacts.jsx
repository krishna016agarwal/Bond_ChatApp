import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.png";
import style from "./contacts.module.css";
import axios from "axios";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

export const Contacts = ({ contacts, groups = [], currentUser, changeChat, setting, onGroupUpdated }) => {
  const [currentUserName, setcurrentUserName] = useState(undefined);
  const [currentUserImage, setcurrentUserImage] = useState(undefined);
  const [currentSelected, setcurrentSelected] = useState(undefined);
  const [, setTick] = useState(Date.now());
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);






  useEffect(() => {


    if (currentUser) {
    
      
      setcurrentUserImage(currentUser.avatarImage);
      setcurrentUserName(currentUser.username);
    }
  }, [currentUser]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick(Date.now());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);



  const changeCurrentChat = (chatId, contact) => {
    setcurrentSelected(chatId);
    changeChat(contact);
  };

  const formatPresence = (contact) => {
    if (contact?.isOnline) {
      return "online";
    }

    if (!contact?.lastSeen) {
      return "offline";
    }

    const lastSeenDate = new Date(contact.lastSeen);
    if (Number.isNaN(lastSeenDate.getTime())) {
      return "offline";
    }

    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return "last seen just now";
    }

    if (diffMinutes < 60) {
      return `last seen ${diffMinutes} min ago`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isToday = lastSeenDate.toDateString() === now.toDateString();
    const isYesterday = lastSeenDate.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `last seen today at ${lastSeenDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    if (isYesterday) {
      return `last seen yesterday at ${lastSeenDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    return `last seen ${lastSeenDate.toLocaleDateString()} at ${lastSeenDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };
 







  const toggleMember = (memberId) => {
    setSelectedMembers((prevMembers) => {
      if (prevMembers.includes(memberId)) {
        return prevMembers.filter((id) => id !== memberId);
      }
      return [...prevMembers, memberId];
    });
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setGroupName("");
    setSelectedMembers([]);
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0 || !currentUser) {
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/groups/create`,
        {
          name: groupName.trim(),
          adminId: currentUser._id,
          members: selectedMembers,
        }
      );

      if (response?.data?.status && response?.data?.group) {
        onGroupUpdated?.(response.data.group);
      }

      closeGroupModal();
    } catch (error) {
      console.error("Unable to create group:", error);
    }
  };

  const displayGroups = useMemo(
    () =>
      (groups || []).map((group) => ({
        ...group,
        isGroup: true,
        chatType: "group",
        username: group.name,
      })),
    [groups]
  );

  const resolveGroupAvatar = (group) => {
    if (!group?.avatarImage) return null;
    return group.avatarImage.startsWith("data:")
      ? group.avatarImage
      : `data:image/svg+xml;base64,${group.avatarImage}`;
  };

  return (
    <>
      {currentUserImage && currentUserName && (
        <div className={style.container}>
          <div className={style.brand}>
            <img src={logo} className={style.logo}></img>
            <h3>Bond</h3>
            <button className={style.createGroupBtn} onClick={() => setShowGroupModal(true)}>
              + Group
            </button>
          </div>

          <div className={style.contacts}>
            <div className={style.sectionTitle}>Chats</div>
            {contacts.map((contact) => {
              const chatId = `user-${contact._id}`;
              return (
                <div
                  className={`${style.contact} ${
                    chatId === currentSelected ? style.selected : ""
                  }`}
                  key={chatId}
                  onClick={() =>
                    changeCurrentChat(chatId, {
                      ...contact,
                      isGroup: false,
                      chatType: "direct",
                    })
                  }
                >
                  <div className={style.avatar}>
                    <img
                      src={`data:image/svg+xml;base64,${contact.avatarImage}`}
                      alt="avatar"
                    ></img>
                  </div>
                  <div className={style.username}>
                    <h3>{contact.username}</h3>
                    <p className={contact.isOnline ? style.online : style.offline}>
                      {formatPresence(contact)}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className={style.sectionTitle}>Groups</div>
            {displayGroups.map((group) => {
              const chatId = `group-${group._id}`;
              const groupAvatar = resolveGroupAvatar(group);
              return (
                <div
                  className={`${style.contact} ${
                    chatId === currentSelected ? style.selected : ""
                  }`}
                  key={chatId}
                  onClick={() => changeCurrentChat(chatId, group)}
                >
                  <div className={`${style.avatar} ${style.groupAvatar}`}>
                    {groupAvatar ? (
                      <img src={groupAvatar} alt="group avatar" className={style.groupImg} />
                    ) : (
                      <span>{group.name?.charAt(0)?.toUpperCase() || "G"}</span>
                    )}
                  </div>
                  <div className={style.username}>
                    <h3>{group.name}</h3>
                    <p className={style.offline}>{(group.members || []).length} members</p>
                  </div>
                </div>
              );
            })}
        
          </div>

          <div className={style.current_user}>
          
            <div className={style.avatar}>
          
              <img
                src={`data:image/svg+xml;base64,${currentUserImage}`}
                alt="avatar"
              ></img>
              <div className={style.username}>
                
                <h3>{currentUserName}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal show={showGroupModal} onHide={closeGroupModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            className={style.groupInput}
            type="text"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <div className={style.memberList}>
            {contacts.map((contact) => (
              <label key={contact._id} className={style.memberItem}>
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(contact._id)}
                  onChange={() => toggleMember(contact._id)}
                />
                <span>{contact.username}</span>
              </label>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeGroupModal}>
            Cancel
          </Button>
          <Button variant="success" onClick={createGroup}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
