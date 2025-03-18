import React, { useState, useEffect } from "react";
import style from "./setting.module.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
const Setting = ({ currentUser }) => {
  const [currentUserName, setcurrentUserName] = useState(undefined);
  const [currentUserEmail, setcurrentUserEmail] = useState(undefined);




  const toastOptions = {
    position: "bottom-right",
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  };






  


  const [state, setstate] = useState({
    username: "",
    email: "",
    password: "",
   
  });


 

  useEffect(() => {
    if (currentUser) {
      setcurrentUserName(currentUser.username);
      setcurrentUserEmail(currentUser.email);
     
    }
  }, [currentUser]);


  const handleChange = (e) => {
   
    setstate({ ...state, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();


      const { password, email, username } = state;
 
 
   
     
        const { data } =  await axios.post(
          `${import.meta.env.MODE==="development" ? `http://localhost:8000/api/update/${currentUser._id}` : `/api/update/${currentUser._id}` }`
          ,
          
           {
          password,
          email,
          username,
          
        });
        if (data.status === false) {
          toast.error(data.message, toastOptions);
        }
        if (data.status === true) {
      
          
          localStorage.setItem("user", JSON.stringify(data.user));
         
          
          setstate({ username: "", email: "", password: "" });
          toast.success("Update successfully created ,Please refresh the Screen", toastOptions);

        }
    
  };

  return (
    <>
      <div className={style.main}>
        <div className={style.details}>
          <div className={style.name }>Name - {currentUserName}</div>
          <div className={style.email}>Email - {currentUserEmail}</div>
        </div>
        
     
      <div className={style.update}>
        <form className={style.form} onSubmit={(event) => handleSubmit(event)}>
          <input
            type="text"
            name="username"
            placeholder="Name"
            value={state.username}
            onChange={(e) => handleChange(e)}
          />
          <input
            type="email"
            placeholder="Email"
                 name="email"
            value={state.email}
            onChange={(e) => handleChange(e)}
          />
          <input
            type="password"
            placeholder="Password"
              name="password"
            value={state.password}
            onChange={(e) => handleChange(e)}
          />
           
          <button className={style.btn}>Update</button>
        </form>
      </div>
       <ToastContainer />
      </div>
    </>
  );
};

export default Setting;
