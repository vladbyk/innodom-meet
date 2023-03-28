import React, {useState, useEffect, useRef, useCallback} from "react";
const pc_config = {
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

const Room = (data) => {
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
    peerConnection.current = new RTCPeerConnection(pc_config);
  //   peerConnection.current.onicecandidate = handleIceCandidate;
  //   peerConnection.current.onremovestream = handleRemoteStreamRemoved;
    console.log("create rtc peer connection");
    return;
  } catch (e) {
    console.log("faild peer ", e.message);
    return;
  }
  };
  //   const handleRemoteStreamAdded = (event) => {
  //     console.log("Remote stream added.");
  //     console.log(event.stream)
  //     console.log(localStream)
  //     remoteStream = event.stream;
  //     remoteVideo.current.srcObject = remoteStream;
  //   };
  
  const processCall = (username) => {
  peerConnection.current.createOffer(
    (session) => {
      peerConnection.current.setLocalDescription(session);
      console.log(session)
      console.log(peerConnection)
    },
    (err) => {
      console.log(err);
    }
  );
  }
  const connectRoom = () => {
      console.log('sok',data.data)
      const socket = new WebSocket(`wss://rims.by/ws/room/${data.data.group}/?user=${data.data.user}`);
      socket.onopen = () => {
          console.log("WebSocket connection established");
          beReady().then((bool)=>{
              processCall()
          })
          socket.send(JSON.stringify({
            type:'joinRoom',
            userID:data.data.user
          }))
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