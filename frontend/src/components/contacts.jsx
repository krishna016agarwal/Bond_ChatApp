import React, { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import style from "./contacts.module.css";

export const Contacts = ({ contacts, currentUser, changeChat,setting }) => {
  const [currentUserName, setcurrentUserName] = useState(undefined);
  const [currentUserImage, setcurrentUserImage] = useState(undefined);
  const [currentSelected, setcurrentSelected] = useState(undefined);






  useEffect(() => {


    if (currentUser) {
    
      
      setcurrentUserImage(currentUser.avatarImage);
      setcurrentUserName(currentUser.username);
    }
  }, [currentUser]);



  const changeCurrentChat = (index, contact) => {
    setcurrentSelected(index);
    changeChat(contact);
  };
 







const handleSetting=()=>{
  alert("setting")
  setting(true);
}

  return (
    <>
      {currentUserImage && currentUserName && (
        <div className={style.container}>
          <div className={style.brand}>
            <img src={logo} className={style.logo}></img>
            <h3>Bond</h3>
          </div>
          <div className={style.contacts}>
            {contacts.map((contact, index) => {
              return (
                <div
                  className={`${style.contact} ${
                    index === currentSelected ? style.selected : ""
                  }`}
                  key={index}
                  onClick={()=>changeCurrentChat(index,contact)}
                >
                  <div className={style.avatar}>
                    <img
                      src={`data:image/svg+xml;base64,${contact.avatarImage}`}
                      alt="avatar"
                    ></img>
                  </div>
                  <div className={style.username}>
                    <h3>{contact.username}</h3>
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
    </>
  );
};
