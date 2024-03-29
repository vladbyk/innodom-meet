import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Lobby from "../Lobby/Lobby";
import Room from "../Room/Room";
import './video-chat.css'
import logo from '../../assets/logo-light.svg'
// import logodip from '../../assets/Group 81557.svg'
import heroImg from '../../assets/hero.svg'
import { BASE_URL } from "../../auth";

const VideoChat = () => {
  const [email, setEmail] = useState("");
  const handleUserEmailChange = useCallback((event) => {
    setEmail(event.target.value);
  }, []);
  let [UserInfo, setUserInfo] = useState();
  // {data:{id:1,group:2,name:'katia'}}
  let [ErrMessage, setErrMessage] = useState("");
  const ConnectionRoom = () => {
    if (email.length > 3) {
      axios
        .post(BASE_URL+"user/", { email: email })
        .then((data) => {
        setErrMessage("Привет,"+data.data.name+' !');
          console.log(data);
          setUserInfo(data);
          // window.location.assign('room')
        })
        .catch((err) => {
          setErrMessage("У пользователя с этой почтой нет доступа");
          console.log(err);
        });
    }else{
        setErrMessage("Почта указана неверно");
    }
  };
  const exitUser=()=>{
    setUserInfo(false)
  }
  return (
    <div>
      
      {UserInfo ? (
        <Room data={UserInfo.data} exitUser={exitUser}/>
      ) : (
        <div className="innomeet">
        <div className="lobby-header">
          <img src={logo} alt="innomeet"/>
        </div>
        <div className="content-lobby">
          <div className="disc-lobby">
        <p className="err-mess">{ErrMessage}</p>
        <Lobby
          email={email}
          handleUserEmailChange={handleUserEmailChange}
          ConnectionRoom={ConnectionRoom}
        /></div>
        <img src={heroImg} alt="innomeet" />
        </div>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
