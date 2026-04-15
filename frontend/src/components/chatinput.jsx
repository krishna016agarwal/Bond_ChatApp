import React, { useState,useRef,useEffect } from "react";
import { IoSend } from "react-icons/io5";
import style from "./chatmessage.module.css";
import Picker from "emoji-picker-react";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { MdAttachFile } from "react-icons/md";

const Chatinput = ({handleSendMsg, handleSendFile}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [message, setMessage] = useState("");
  const emojiPickerRef = useRef(null); // Reference for emoji picker
  const fileInputRef = useRef(null);
  const handleEmoji = () => {
    setShowEmoji(!showEmoji);
  };

  const handleEmojiClick = (emojiObject) => {
    
   
    if (!emojiObject || !emojiObject.emoji) {
        console.error("Emoji not found:", emojiObject);
        return;
    }

    let newMessage = message + emojiObject.emoji;
    setMessage(newMessage);
};
const toggleEmojiPicker = () => {
  setShowEmoji((prev) => !prev);
};
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      event.target.value = "";
      return;
    }

    handleSendFile?.(file);
    event.target.value = "";
  };
  const sendChat=(e)=>{
  
    e.preventDefault();
    
    
  if(message.length>0){
    handleSendMsg(message);
    setMessage("");
  }
  }


  useEffect(() => {
    const handleClickOutside = (event) => {
        if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
            setShowEmoji(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, []);

  return (
    <div className={style.main}>
      <div className={style.container}>
       
        <div className={style.emoji} ref={emojiPickerRef}>
        <MdOutlineEmojiEmotions onClick={toggleEmojiPicker} />
                    {showEmoji && (
                        <Picker className={style.emojibox} onEmojiClick={handleEmojiClick} />
                    )}
        </div>
        <button type="button" className={style.attachBtn} onClick={openFilePicker}>
          <MdAttachFile />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>
      <form className={style.form2} onSubmit={(e)=>sendChat(e)}>
        <input
          className={style.input}
          type="text"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className={style.btn4} type="submit">
          <IoSend className={style.btn5} />
        </button>
      </form>
    </div>
  );
};

export default Chatinput;