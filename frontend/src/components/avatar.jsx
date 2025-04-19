import React from "react";
import style from "./avatar.module.css";
import {  useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import logo from "../assets/logo.png";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";

import { Buffer } from "buffer";

export const Avatar = () => {
  const api = "https://api.dicebear.com/9.x/avataaars/svg?seed=";

  const navigate = useNavigate();

  const [avatar, setAvatar] = useState([]);

  const [selectedAvatar,  setSelectedAvatar] = useState(undefined);

  const [isLoading, setIsLoading] = useState(false);

  // useEffect(()=>{
  //   const a=JSON.parse(localStorage.getItem("user"))

 
  //   if(a.isAvatarImageSet){

  //    navigate("/")
  //   }
  // },[])

  // useEffect(() => {
  //   if (!localStorage.getItem("user")) {
  //     navigate("/login");
  //   }
  // }, []);


  const toastOptions = {
    position: "bottom-right",
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  };





  
  const setProfilePicture = async () => {
   
    if (selectedAvatar === undefined) {
      toast.error("Please select an avatar");
    } else {
      const user = await JSON.parse(localStorage.getItem("user"));
      
      const { data } = await axios.post(
        `${import.meta.env.MODE==="development" ? `http://localhost:8000/api/avatar/${user._id}` : `/api/avatar/${user._id}` }`,
        {
          image: avatar[selectedAvatar],
        }
      );
      if (data.isSet) {
        user.isAvatarImageSet = true;
        user.avatarImage = data.image;
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/");
      } 
      
      else {
        
        
        toast.error("Error setting avatar. Please try again", toastOptions);
      }
    }
  };
  async function data() {
  

    const data = [];
    for (let i = 0; i < 4; i++) {


      const image = await axios.get(
        `${api}/${Math.random().toString(36).substring(2, 10)}`
      );
     

      const buffer = new Buffer(image.data);
      data.push(buffer.toString("base64"));
    }
    setAvatar(data);
    setIsLoading(false);
  }
  useEffect(() => {
 

    data();
  }, []);


 
  return (
    <>
      {isLoading ? (
        <div className={style.main}>
          <span className={style.loader}></span>
        </div>
      ) : (
      <div className={style.main}>
        <div className={style.brand}>
          <img src={logo} className={style.logo}></img>
          <h1>Bond</h1>
        </div>
        <div className={style.title}>
          <h1>Pick an avatar at your profile picture</h1>
        </div>
        <div className={style.avatar}>
          {avatar.map((avatar, index) => {
            return (
              <div
                key={index}
                className={`${style.avatar} ${
                  selectedAvatar === index ? style.selected : ""
                }`}
              >
                <img
                  src={`data:image/svg+xml;base64,${avatar}`}
                  alt="avatar"
                  key={avatar}
                  width="100" height="100"
                  onClick={() => setSelectedAvatar(index)}
                ></img>
              </div>
            );
          })}
        </div>
        <button className={style.submit} onClick={setProfilePicture}>
          Set as Profile Picture
        </button>
      </div>
       )} 
      <ToastContainer></ToastContainer>
    </>
  );
};
