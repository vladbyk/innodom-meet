import axios from "axios";
import React, {useState, useEffect, useRef, useCallback} from "react";

const VideoChat = () => {
    const [email,setEmail]=useState('')
    const handleUserEmailChange = useCallback((event) => {
        setEmail(event.target.value);
      }, []);
    let [UserInfo,setUserInfo]=useState()
    let [ErrMessage,setErrMessage]=useState('')
    const ConnectionRoom=()=>{
        if(email.length>3){
            axios.post('https://rims.by/api/user/',{email:email})
            .then((data)=>{
                console.log(data)
                setUserInfo(data)
            })
            .catch((err)=>{
                setErrMessage('У пользователя с этой почтой нет доступа')
                console.log(err)
            })
        }
    }
    return (
       <div>
           <h1>InnoDOM Video Conference</h1>
        <label htmlFor="email">Name:</label>
           <input
          type="email"
          id="email"
          value={email}
          onChange={handleUserEmailChange}
          required
        />
        <button onClick={ConnectionRoom}>Connect</button>
       </div>
   );
}

export default VideoChat;