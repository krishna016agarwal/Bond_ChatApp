import React from 'react'
import {useNavigate} from 'react-router-dom'
import { MdLogout } from "react-icons/md";
import styled from 'styled-components'
const Logout = () => {
    const navigate=useNavigate();
    const handleClick = async() =>{
localStorage.clear();
navigate('/login');
    }
  return (

<Button onClick={handleClick}>
<MdLogout />
</Button>

  )
}

export default Logout

const Button = styled.button`
display:flex;
justify-content:center;
align-items:center;
padding:0.5rem;
border-radius:0.5rem;
border:none;
cursor:pointer;
background-color:#9cff9c;
;`;