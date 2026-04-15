import { useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import { IoMenu } from "react-icons/io5";
import style from "./slidebar.module.css";

import { Contacts } from "./contacts";

function Slidebar({ setCurrentChat, contacts, groups, currentUser, onGroupUpdated }) {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);

    handleClose();
  };

  return (
    <>
      <IoMenu
        onClick={handleShow}
        className={style.slidebar}
        cursor={"pointer"}
        size={30}
      />

      <Offcanvas show={show} onHide={handleClose} className={style.main}>
        <Offcanvas.Header closeButton className={style.header2}> </Offcanvas.Header>
        <Contacts
          contacts={contacts}
          groups={groups}
          currentUser={currentUser}
          changeChat={handleChatChange}
          onGroupUpdated={onGroupUpdated}
        ></Contacts>
      </Offcanvas>
    </>
  );
}

export default Slidebar;
