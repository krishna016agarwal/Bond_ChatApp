import { useState,useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import axios from "axios";
import Offcanvas from 'react-bootstrap/Offcanvas';
import { IoMenu } from "react-icons/io5";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import style from "./slidebar.module.css"


import { Contacts } from "./contacts";











function Slidebar({setCurrentChat,currentChat}) {




  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);










  
  const [contacts, setContacts] = useState([]);
  const [isLoadded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(undefined);







  async function curr() {
    if (currentUser) {
      if (currentUser.isAvatarImageSet) {
        const data = await axios.get(
          `http://localhost:8000/api/allUsers/${currentUser._id}`
        );
        setContacts(data.data);
      } else {
        navigate("/setAvatar");
      }
    }
  }


  useEffect(() => {
    curr();
  }, [currentUser]);

  const navigate = useNavigate();

  async function fun() {
    if (!localStorage.getItem("user")) {
      navigate("/login");
    } else {
      setCurrentUser(await JSON.parse(localStorage.getItem("user")));

      setIsLoaded(true);
    }
  }

  useEffect(() => {
    fun();
  }, []);

  const handleChatChange = (chat) => {
    
    
    setCurrentChat(chat);
  
    handleClose()
  };

 
















  return (
    <>
      
      <IoMenu  onClick={handleShow}  className={style.slidebar} cursor={"pointer"} size={30} />
    

      <Offcanvas show={show} onHide={handleClose}>
        <Offcanvas.Header closeButton>   </Offcanvas.Header>
        <Contacts 
             contacts={contacts}
             currentUser={currentUser}
             changeChat={handleChatChange}
        
           ></Contacts>
      
        
      </Offcanvas>
    </>
  );





}

export default Slidebar;


