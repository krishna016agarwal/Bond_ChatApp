import React, { useState,useRef,useEffect } from "react";
import { IoSend } from "react-icons/io5";
import style from "./chatmessage.module.css";
import Picker from "emoji-picker-react";
import { MdOutlineEmojiEmotions } from "react-icons/md";

const Chatinput = ({handleSendMsg}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [message, setMessage] = useState("");
  const emojiPickerRef = useRef(null); // Reference for emoji picker
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