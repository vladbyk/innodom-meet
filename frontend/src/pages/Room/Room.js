import axios from "axios";
import React, {useState, useEffect, useRef, useCallback} from "react";

const Room = (data) => {
    const config = {
        iceServers: [
          {
            urls: "stun:stun.rims.by:5349",
          },
          {
            "url": "turn:turn.rims.by:5349",
            "username": "guest",
            "credential": "somepassword"
          }
        ],
      };

    let localVideo = useRef()
    let localStream;
    let peerConnection=useRef()
    let callSocket=useRef()
    const beReady = () => {
        return navigator.mediaDevices.getUserMedia({
         audio: true,
         video: true,
       }).then((stream)=>{
       localStream = stream;
       console.log(stream)
       localVideo.current.srcObject = stream;
       return createConnectionAndAddStream();
     }).catch( (err)=>{
       console.log(err);
     })
   };
   const createConnectionAndAddStream = () => {
    createPeerConnection();
    peerConnection.current.addStream(localStream);
    return true;
  };
  const createPeerConnection = () => {
    try {
      peerConnection.current = new RTCPeerConnection(config);
    //   peerConnection.current.onicecandidate = handleIceCandidate;
    //   peerConnection.current.onaddstream = handleRemoteStreamAdded;
    //   peerConnection.current.onremovestream = handleRemoteStreamRemoved;
      console.log("create rtc peer connection");
      return;
    } catch (e) {
      console.log("faild peer ", e.message);
      return;
    }
  };
  const processCall = (username) => {
    peerConnection.current.createOffer(
      (session) => {
        peerConnection.current.setLocalDescription(session);
        console.log(session)
      },
      (err) => {
        console.log(err);
      }
    );
  }
    const connectRoom = () => {
        console.log('sok',data.data)
        const socket = new WebSocket(`wss://rims.by/ws/room/${data.data.group}/`);
        socket.onopen = () => {
            console.log("WebSocket connection established");
            beReady().then((bool)=>{
                processCall()
            })
            // socket.send(JSON.stringify({type: "join_room", roomId}));
        };
        // socket.onmessage = (event) => {
        //     const message = JSON.parse(event.data);
        // };
        // return () => {
        //     socket.close();
        // };
    };

    useEffect(()=>{
        connectRoom()
    },[])
    return (
       <div>
           <h1>room</h1>
           <video muted autoPlay ref={localVideo}></video>
       </div>
   );
}

export default Room;