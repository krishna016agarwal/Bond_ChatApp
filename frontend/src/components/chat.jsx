// import React from "react";
// import style from "./chat.module.css";
// import { useNavigate } from "react-router-dom";
// import { useState, useEffect, useRef } from "react";
// import { Contacts } from "./contacts";
// import { Home } from "./home";
// import Logout from "./logout";
// import axios from "axios";
// import ChatContainer from "./chatcontainer";
// import { io } from "socket.io-client";
// import Setting from "./setting";

// import { IoSettingsOutline } from "react-icons/io5";
// import Slidebar from "./slidebar";
// export const Chat = () => {
//   const socket = useRef();

//   const [currentChat, setCurrentChat] = useState(undefined);
//   const [contacts, setContacts] = useState([]);
//   const [isLoadded, setIsLoaded] = useState(false);
//   const [currentUser, setCurrentUser] = useState(undefined);
//   async function curr() {
//     if (currentUser) {
//       if (currentUser.isAvatarImageSet) {
//         const data = await axios.get(
//            `${import.meta.env.MODE==="development" ? `http://localhost:8000/api/allUsers/${currentUser._id}` : `/api/allUsers/${currentUser._id}` }`
         
//         );
//         setContacts(data.data);
//       } else {
//         navigate("/setAvatar");
//       }
//     }
//   }
//   useEffect(() => {
//     if (currentUser) {
//       socket.current = io("http://localhost:8000");
//       socket.current.emit("add-user", currentUser._id);
//     }
//   }, [currentUser]);

//   useEffect(() => {
//     curr();
//   }, [currentUser]);

//   const navigate = useNavigate();

//   async function fun() {
//     if (!localStorage.getItem("user")) {
//       navigate("/login");
//     } else {
//       setCurrentUser(await JSON.parse(localStorage.getItem("user")));

//       setIsLoaded(true);
//     }
//   }

//   useEffect(() => {
//     fun();
//   }, []);

//   const handleChatChange = (chat) => {
//     setCurrentChat(chat);
//     setSetting(false);
//   };

//   const [setting, setSetting] = useState(false);
//   let button = false;
//   var handleSetting = () => {
//     if (button === false) {
//       setSetting(true);
//       button = true;
//     } else if (button === true) {
//       setSetting(false);
//       button = false;
//     }
//   };

//   return (
//     <>
//       <div className={style.main}>
//         <div className={style.container}>
//           <div className={style.line}>
//             <Slidebar currentChat={currentChat} setCurrentChat={setCurrentChat}></Slidebar>
//             <div className={style.cont}>
//             <Logout></Logout>
//             <IoSettingsOutline
//               className={style.setting}
//               onClick={handleSetting}
//             />
//             </div>
           
//           </div>

//           <Contacts
//             contacts={contacts}
//             currentUser={currentUser}
//             changeChat={handleChatChange}
//             setting={setting}
//           ></Contacts>

         


//           {setting === true ? (
//             <Setting currentUser={currentUser}></Setting>
//           ) : currentChat === undefined ? (
           
//             <Home currentUser={currentUser}></Home>
//           ) : (
//             <ChatContainer
//               currentChat={currentChat}
//               currentUser={currentUser}
//               socket={socket}
//             ></ChatContainer>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };









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
            `${import.meta.env.MODE === "development" ? `http://localhost:8000/api/allUsers/${currentUser._id}` : `/api/allUsers/${currentUser._id}`}`
          );
          setContacts(data.data);
        } catch (error) {
          console.error("Error fetching contacts:", error);
        }
      } else {
        navigate("/setAvatar");
      }
    }
  };

  // Socket setup after user is set
  useEffect(() => {
    if (currentUser) {
      const socketURL =
        import.meta.env.MODE === "development"
          ? "http://localhost:8000"
          : "https://bond-chatapp-backend.onrender.com"; // For production URL
      socket.current = io(socketURL);
      socket.current.emit("add-user", currentUser._id);
    }
  }, [currentUser]);

  // Fetch contacts on currentUser change
  useEffect(() => {
    fetchContacts();
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
            <Slidebar currentChat={currentChat} setCurrentChat={setCurrentChat}></Slidebar>
            <div className={style.cont}>
              <Logout></Logout>
              <IoSettingsOutline className={style.setting} onClick={handleSetting} />
            </div>
          </div>

          <Contacts
            contacts={contacts}
            currentUser={currentUser}
            changeChat={handleChatChange}
            setting={setting}
          ></Contacts>

          {setting ? (
            <Setting currentUser={currentUser}></Setting>
          ) : currentChat ? (
            <ChatContainer currentChat={currentChat} currentUser={currentUser} socket={socket}></ChatContainer>
          ) : (
            <Home currentUser={currentUser}></Home>
          )}
        </div>
      </div>
    </>
  );
};
