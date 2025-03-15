import React from 'react'
// import chatbond from "../assets/chatbond.jpg";
import style from "./home.module.css";

export const Home=({currentUser}) =>{

  return (
    <div className={style.home}>
 
      <h1>Welcome <span></span></h1>
      <h3>Please select a chart to start Messaging </h3>
    </div>
  )
}


    
