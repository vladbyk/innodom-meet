import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Lobby from "../Lobby/Lobby";
import Room from "../Room/Room";
import './video-chat.css'

const VideoChat = () => {
  const [email, setEmail] = useState("");
  const handleUserEmailChange = useCallback((event) => {
    setEmail(event.target.value);
  }, []);
  let [UserInfo, setUserInfo] = useState();
  let [ErrMessage, setErrMessage] = useState("");
  const ConnectionRoom = () => {
    if (email.length > 3) {
      axios
        .post("https://rims.by/api/user/", { email: email })
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
  return (
    <div className="innomeet">
      <h1>InnoMeet</h1>
      <p>{ErrMessage}</p>
      {UserInfo ? (
        <Room data={UserInfo.data}/>
      ) : (
        <Lobby
          email={email}
          handleUserEmailChange={handleUserEmailChange}
          ConnectionRoom={ConnectionRoom}
        />
      )}
    </div>
  );
};

export default VideoChat;
