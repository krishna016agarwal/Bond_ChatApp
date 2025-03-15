import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Signup } from "./components/signup"
import { Login } from "./components/login"
import { Chat } from "./components/chat"
import { Avatar } from "./components/avatar"


const App=()=> {
  const router =createBrowserRouter([
    {
      path:"/signup",
      element: <Signup></Signup>
    },
    {
      path:"/login",
      element:<Login></Login>
    },
    {
      path:"/",
      element:<Chat></Chat>
    },{
      path:"/setAvatar",
      element:<Avatar></Avatar>
    }
  ])

  return <RouterProvider router={router}></RouterProvider>;
  
}

export default App
