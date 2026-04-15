import React, { useEffect, useState, useRef } from "react";
import style from "./chatcontainer.module.css";
import Chatinput from "./chatinput";
import axios from "axios";
import { v4 as uuid4 } from "uuid";
import { BsCheck2, BsCheck2All } from "react-icons/bs";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

const ChatContainer = ({
  currentChat,
  currentUser,
  contacts = [],
  socket,
  onGroupUpdated,
  onGroupDeleted,
}) => {
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const scrollRef = useRef();
  const [messages, setMessages] = useState([]);
  const [, setTick] = useState(Date.now());
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const avatarFileInputRef = useRef(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showSeenByModal, setShowSeenByModal] = useState(false);
  const [selectedMessageSeenBy, setSelectedMessageSeenBy] = useState([]);
  const [selectedMessageMeta, setSelectedMessageMeta] = useState("");

  const isGroupChat = Boolean(currentChat?.isGroup || currentChat?.chatType === "group");
  const isCurrentUserAdmin = isGroupChat
    ? (currentChat?.admins || []).some((admin) => String(admin._id || admin) === String(currentUser._id))
    : false;

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat) return;

      if (isGroupChat) {
        const groupResponse = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/messages/get-group-msg`,
          {
            groupId: currentChat._id,
            currentUserId: currentUser._id,
          }
        );
        setMessages(groupResponse.data || []);

        const seenResponse = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/messages/mark-group-seen`,
          {
            groupId: currentChat._id,
            userId: currentUser._id,
          }
        );

        const seenIds = seenResponse?.data?.updatedIds || [];
        if (seenIds.length > 0 && socket.current) {
          socket.current.emit("group-messages-seen", {
            groupId: currentChat._id,
            userId: currentUser._id,
            userName: currentUser.username,
            messageIds: seenIds,
          });
        }
      } else {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/messages/getmsg`,
          {
            from: currentUser._id,
            to: currentChat._id,
          }
        );
        setMessages(response.data || []);

        const markReadResponse = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/messages/mark-read`,
          {
            from: currentUser._id,
            to: currentChat._id,
          }
        );

        const updatedIds = markReadResponse?.data?.updatedIds || [];
        if (updatedIds.length > 0 && socket.current) {
          socket.current.emit("messages-read", {
            messageIds: updatedIds,
            to: currentChat._id,
          });
        }
      }
    };

    fetchMessages();
  }, [currentChat, currentUser, isGroupChat, socket]);

  const buildAttachmentPayload = (fileName, fileUrl, mimeType) => {
    const fileType = mimeType === "application/pdf" ? "pdf" : "image";
    return {
      fileName,
      fileUrl,
      fileType,
      mimeType,
    };
  };

  const pushLocalMessage = ({ data, message, attachment }) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        _id: data.messageId,
        fromSelf: true,
        senderName: currentUser.username,
        message,
        attachment: attachment || null,
        time: data.time,
        status: data.status || "sent",
        seenBy: [{ _id: currentUser._id, username: currentUser.username }],
      },
    ]);
  };

  const handleSendMsg = async (message, attachment = null) => {
    if (isGroupChat) {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/messages/add-group-msg`,
        {
          from: currentUser._id,
          groupId: currentChat._id,
          message,
          attachment,
          time: new Date(Date.now()).toLocaleString("en-IN"),
        }
      );

      socket.current.emit("send-group-msg", {
        groupId: currentChat._id,
        from: currentUser._id,
        senderName: currentUser.username,
        messageId: data.messageId,
        message,
        attachment,
        seenBy: [{ _id: currentUser._id, username: currentUser.username }],
        time: data.time,
      });

      pushLocalMessage({ data, message, attachment });
    } else {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/messages/addmsg`,
        {
          from: currentUser._id,
          to: currentChat._id,
          message,
          attachment,
          time: new Date(Date.now()).toLocaleString("en-IN"),
        }
      );

      socket.current.emit("send-msg", {
        to: currentChat._id,
        from: currentUser._id,
        messageId: data.messageId,
        message,
        attachment,
        time: data.time,
      });

      pushLocalMessage({ data, message, attachment });
    }
  };

  const handleSendFile = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const attachment = buildAttachmentPayload(file.name, reader.result, file.type);
      const defaultText = attachment.fileType === "pdf" ? `PDF: ${file.name}` : "Image";
      handleSendMsg(defaultText, attachment);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!socket.current) return;

    socket.current.on("receive-msg", (msg) => {
      if (isGroupChat) return;

      setArrivalMessage({
        _id: msg.messageId || uuid4(),
        fromSelf: false,
        message: msg.message,
        attachment: msg.attachment || null,
        time: msg.time,
        status: "read",
      });

      socket.current.emit("message-delivered", {
        messageId: msg.messageId,
        to: msg.from,
      });

      socket.current.emit("message-read", {
        messageId: msg.messageId,
        to: msg.from,
      });
    });

    socket.current.on("receive-group-msg", (msg) => {
      if (!isGroupChat) return;
      if (String(msg.groupId) !== String(currentChat._id)) return;

      setArrivalMessage({
        _id: msg.messageId || uuid4(),
        fromSelf: String(msg.from) === String(currentUser._id),
        senderName: msg.senderName || "Unknown",
        message: msg.message,
        attachment: msg.attachment || null,
        seenBy: msg.seenBy || [],
        time: msg.time,
        status: "sent",
      });

      socket.current.emit("group-messages-seen", {
        groupId: msg.groupId,
        userId: currentUser._id,
        userName: currentUser.username,
        messageIds: [msg.messageId],
      });
    });

    socket.current.on("group-messages-seen", ({ userId, userName, messageIds }) => {
      const seenSet = new Set((messageIds || []).map((id) => String(id)));
      setMessages((prevMessages) =>
        prevMessages.map((message) => {
          if (!seenSet.has(String(message._id))) return message;

          const existingSeenBy = Array.isArray(message.seenBy) ? message.seenBy : [];
          const alreadySeen = existingSeenBy.some(
            (user) => String(user._id || user) === String(userId)
          );

          if (alreadySeen) return message;

          return {
            ...message,
            seenBy: [...existingSeenBy, { _id: userId, username: userName || "Unknown" }],
          };
        })
      );
    });

    socket.current.on("message-delivered", ({ messageId }) => {
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          String(message._id) === String(messageId) && message.fromSelf
            ? { ...message, status: "delivered" }
            : message
        )
      );
    });

    socket.current.on("message-read", ({ messageId }) => {
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          String(message._id) === String(messageId) && message.fromSelf
            ? { ...message, status: "read" }
            : message
        )
      );
    });

    socket.current.on("message-read-bulk", ({ messageIds }) => {
      const readIds = new Set((messageIds || []).map((id) => String(id)));
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          readIds.has(String(message._id)) && message.fromSelf
            ? { ...message, status: "read" }
            : message
        )
      );
    });

    return () => {
      socket.current.off("receive-msg");
      socket.current.off("receive-group-msg");
      socket.current.off("group-messages-seen");
      socket.current.off("message-delivered");
      socket.current.off("message-read");
      socket.current.off("message-read-bulk");
    };
  }, [socket, isGroupChat, currentChat, currentUser]);

  useEffect(() => {
    if (arrivalMessage) {
      setMessages((prevMessages) => [...prevMessages, arrivalMessage]);
    }
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick(Date.now());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const formatPresence = () => {
    if (currentChat?.isOnline) {
      return "online";
    }

    if (!currentChat?.lastSeen) {
      return "offline";
    }

    const lastSeenDate = new Date(currentChat.lastSeen);
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

  const renderTicks = (message) => {
    if (isGroupChat) return null;
    if (!message.fromSelf) return null;

    if (message.status === "read") {
      return <BsCheck2All className={`${style.tick} ${style.tickRead}`} />;
    }

    if (message.status === "delivered") {
      return <BsCheck2All className={style.tick} />;
    }

    return <BsCheck2 className={style.tick} />;
  };

  const toggleMember = (memberId) => {
    setSelectedMembers((prevSelected) => {
      if (prevSelected.includes(memberId)) {
        return prevSelected.filter((id) => id !== memberId);
      }
      return [...prevSelected, memberId];
    });
  };

  const addMembersToGroup = async () => {
    if (!isGroupChat || selectedMembers.length === 0) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/groups/add-members/${currentChat._id}`,
        {
          adminId: currentUser._id,
          members: selectedMembers,
        }
      );

      if (response?.data?.status && response?.data?.group) {
        onGroupUpdated?.(response.data.group);
      }

      setSelectedMembers([]);
      setShowAddMembers(false);
    } catch (error) {
      console.error("Unable to add members:", error);
    }
  };

  const leaveGroup = async () => {
    if (!isGroupChat) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/groups/leave/${currentChat._id}`,
        {
          userId: currentUser._id,
        }
      );

      if (response?.data?.deleted || response?.data?.group) {
        onGroupDeleted?.(currentChat._id);
      }
    } catch (error) {
      console.error("Unable to leave group:", error);
    }
  };

  const deleteGroup = async () => {
    if (!isGroupChat) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/groups/${currentChat._id}`,
        {
          data: {
            adminId: currentUser._id,
          },
        }
      );

      if (response?.data?.status) {
        onGroupDeleted?.(currentChat._id);
      }
    } catch (error) {
      console.error("Unable to delete group:", error);
    }
  };

  const kickMember = async (memberId) => {
    if (!isGroupChat) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/groups/kick/${currentChat._id}`,
        {
          adminId: currentUser._id,
          memberId,
        }
      );

      if (response?.data?.status && response?.data?.group) {
        onGroupUpdated?.(response.data.group);
      }
    } catch (error) {
      console.error("Unable to kick member:", error);
    }
  };

  const resolveAvatarSrc = (chat) => {
    if (!chat?.avatarImage) {
      return null;
    }

    if (chat.avatarImage.startsWith("data:")) {
      return chat.avatarImage;
    }

    return `data:image/svg+xml;base64,${chat.avatarImage}`;
  };

  const triggerGroupAvatarPicker = () => {
    avatarFileInputRef.current?.click();
  };

  const handleGroupAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !isGroupChat || !isCurrentUserAdmin) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const avatarImage = reader.result;
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/groups/avatar/${currentChat._id}`,
          {
            adminId: currentUser._id,
            avatarImage,
          }
        );

        if (response?.data?.status && response?.data?.group) {
          onGroupUpdated?.(response.data.group);
        }
      } catch (error) {
        console.error("Unable to update group avatar:", error);
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const renameGroup = async () => {
    if (!newGroupName.trim() || !isGroupChat || !isCurrentUserAdmin) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || `http://localhost:8000`}/api/groups/rename/${currentChat._id}`,
        {
          adminId: currentUser._id,
          name: newGroupName.trim(),
        }
      );

      if (response?.data?.status && response?.data?.group) {
        onGroupUpdated?.(response.data.group);
      }

      setShowRenameModal(false);
      setNewGroupName("");
    } catch (error) {
      console.error("Unable to rename group:", error);
    }
  };

  const openSeenByModal = (message) => {
    if (!isGroupChat) return;

    const seenBy = (message.seenBy || []).filter(
      (user) => String(user._id || user) !== String(currentUser._id)
    );

    setSelectedMessageSeenBy(seenBy);
    setSelectedMessageMeta(message.message || message.attachment?.fileName || "Attachment");
    setShowSeenByModal(true);
  };

  const renderAttachment = (attachment) => {
    if (!attachment?.fileUrl) return null;

    if (attachment.fileType === "image") {
      return <img src={attachment.fileUrl} alt={attachment.fileName || "image"} className={style.chatImage} />;
    }

    if (attachment.fileType === "pdf") {
      return (
        <a href={attachment.fileUrl} target="_blank" rel="noreferrer" className={style.pdfLink}>
          {attachment.fileName || "Open PDF"}
        </a>
      );
    }

    return null;
  };

  return (
    <>
      {currentChat && (
        <div className={style.main}>
          <div className={style.header}>
            <div className={style.user}>
              <div className={style.avatar}>
                {resolveAvatarSrc(currentChat) ? (
                  <img src={resolveAvatarSrc(currentChat)} alt="avatar" />
                ) : (
                  <div className={style.groupFallbackAvatar}>
                    {(currentChat.username || currentChat.name || "G").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={style.username}>
                <h3>{currentChat.username || currentChat.name}</h3>
                {isGroupChat ? (
                  <p className={style.offline}>{(currentChat.members || []).length} participants</p>
                ) : (
                  <p className={currentChat?.isOnline ? style.online : style.offline}>{formatPresence()}</p>
                )}
              </div>
            </div>
            {isGroupChat && (
              <div className={style.groupActions}>
                {isCurrentUserAdmin && (
                  <button
                    className={style.groupBtn}
                    onClick={() => {
                      setNewGroupName(currentChat.name || currentChat.username || "");
                      setShowRenameModal(true);
                    }}
                  >
                    Rename
                  </button>
                )}
                {isCurrentUserAdmin && (
                  <button className={style.groupBtn} onClick={triggerGroupAvatarPicker}>
                    Avatar
                  </button>
                )}
                {isCurrentUserAdmin && (
                  <button className={style.groupBtn} onClick={() => setShowAddMembers(true)}>
                    Add
                  </button>
                )}
                <button className={style.groupBtn} onClick={() => setShowMembers(true)}>
                  Members
                </button>
                <button className={style.groupBtn} onClick={leaveGroup}>
                  Leave
                </button>
                {isCurrentUserAdmin && (
                  <button className={`${style.groupBtn} ${style.deleteBtn}`} onClick={deleteGroup}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={style.chat_messages}>
            {messages.map((message) => {
              const date = message.time;
              return (
                <div ref={scrollRef} key={message._id || uuid4()}>
                  <div
                    className={`${style.message} ${
                      message.fromSelf ? `${style.sended}` : `${style.received}`
                    }`}
                    onClick={() => openSeenByModal(message)}
                  >
                    <div className={style.note}>
                      <div className={style.content}>
                        {isGroupChat && !message.fromSelf && (
                          <span className={style.senderName}>{message.senderName}</span>
                        )}
                        {message.message ? <p>{message.message}</p> : null}
                        {renderAttachment(message.attachment)}
                      </div>
                      <div className={style.meta}>
                        <p>{date}</p>
                        {renderTicks(message)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Chatinput handleSendMsg={handleSendMsg} handleSendFile={handleSendFile} />
          <input
            ref={avatarFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleGroupAvatarChange}
            style={{ display: "none" }}
          />
        </div>
      )}

      <Modal show={showRenameModal} onHide={() => setShowRenameModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rename Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            className={style.renameInput}
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Enter new group name"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRenameModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={renameGroup}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showSeenByModal} onHide={() => setShowSeenByModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Seen by</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className={style.seenMeta}>{selectedMessageMeta}</p>
          <div className={style.memberListModal}>
            {selectedMessageSeenBy.length === 0 ? (
              <p className={style.offline}>No one has seen this yet</p>
            ) : (
              selectedMessageSeenBy.map((user) => (
                <div key={String(user._id || user)} className={style.memberRow}>
                  <span>{user.username || "Member"}</span>
                </div>
              ))
            )}
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showAddMembers} onHide={() => setShowAddMembers(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add members</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={style.memberListModal}>
            {contacts
              .filter(
                (contact) =>
                  !(currentChat?.members || []).some(
                    (member) => String(member._id || member) === String(contact._id)
                  )
              )
              .map((contact) => (
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
          <Button variant="secondary" onClick={() => setShowAddMembers(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={addMembersToGroup}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showMembers} onHide={() => setShowMembers(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Group members</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={style.memberListModal}>
            {(currentChat?.members || []).map((member) => {
              const isMemberAdmin = (currentChat?.admins || []).some(
                (admin) => String(admin._id || admin) === String(member._id || member)
              );
              const memberId = member._id || member;

              return (
                <div key={String(memberId)} className={style.memberRow}>
                  <span>
                    {member.username || "Member"} {isMemberAdmin ? "(admin)" : ""}
                  </span>
                  {isCurrentUserAdmin && !isMemberAdmin && (
                    <button className={style.kickBtn} onClick={() => kickMember(memberId)}>
                      Kick
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ChatContainer;
