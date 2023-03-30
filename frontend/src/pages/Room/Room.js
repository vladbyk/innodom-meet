import React, {useState, useEffect, useRef, useCallback} from "react";
import Video from "./Video";
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
  let pcs;
  const [users,setUsers]=useState([])

  const beReady = () => {
      return navigator.mediaDevices.getUserMedia({
       audio: true,
       video: true,
     }).then((stream)=>{
     localStream = stream;
     console.log(stream)
     localVideo.current.srcObject = stream;
   }).catch( (err)=>{
     console.log(err);
   })
  };
  const createPeerConnection = useCallback( (socketID,localStream,email) => {
  let pc=new RTCPeerConnection(pc_config)
  pcs={...pcs,[socketID]:pc}

  console.log(pc)
  pc.onicecandidate=(e)=>{
    if(e.candidate){
    console.log('on ice cang',e)
            callSocket.current.send(JSON.stringify({
              candidate: e.candidate,
              channel_name:socketID,
              type:'candidate',
              user:data.data.id
            }))}
  }

  pc.onconnectionstatechange=(e)=>{
    console.log('onconnectionstatechange',e)
  }

  pc.ontrack=(e)=>{
    console.log('otrack',socketID)
    console.log('otrack',users)
    console.log('otrack',e)
    // setUsers((oldUsers)=>oldUsers.filter(user=>user.id!==socketID))
    setUsers(oldUsers=>{return[...oldUsers,{email:email,id:socketID,stream:e.streams[0]}]})
    console.log(users)
  }

  if(localStream){
    localStream.getTracks().forEach(track=>{
      pc.addTrack(track,localStream)
    })
  }else{console.log('no local stream')}

  return pc;
  },[]);
  
  const processCall = useCallback((username) => {
    callSocket.current.send(JSON.stringify({
            type:'joinRoom',
            group:data.data.group,
            user:data.data.id,
          }))
  let pc=new RTCPeerConnection(pc_config)
  if(localStream){
    console.log('lockal streem add',localVideo)
    localStream.getTracks().forEach(track => {
      pc.addTrack(track,localStream)
    });
  }

  },[])
  const connectRoom = () => {
      console.log('sok',data.data)
      callSocket.current = new WebSocket(`wss://rims.by/ws/room/${data.data.group}/?user=${data.data.id}`);
      callSocket.current.onopen = () => {
          console.log("WebSocket connection established");
          beReady().then((bool)=>{
              processCall()
          })
      };

      callSocket.current.onmessage = (e) => {
        let response = JSON.parse(e.data);
        let type = response.type;
        if (type == "getJoinRoom") {
          console.log('get join room',response);
          if(response.allUsers.length>0){
            response.allUsers.map(item=>{
              createPeerConnection(item.channel_name,localStream,item.email)
              let pc=pcs[item.channel_name]
              if(pc){
  pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  })
  .then(sdp=>{
    console.log('create off ',sdp)
    console.log(item)
    pc.setLocalDescription(new RTCSessionDescription(sdp))
    callSocket.current.send(JSON.stringify({
      type:'offer',
      sdp:sdp,
      channel_name:item.channel_name,
      user:data.data.id
    }))
  })
  .catch(err=>console.log(err))
              }
            })
          }
        }
        if (type == "getOffer") {
          console.log('get sender offer',response);
          createPeerConnection(response.channel_name_sender,response.email,localStream)
          let pc = pcs[response.channel_name_sender]
          if(pc){
            console.log(pc)
            console.log(pcs)
            pc.setRemoteDescription(new RTCSessionDescription(response.sdp))
            .then(()=>{
              pc.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
              })
              .then(sdp=>{
                pc.setLocalDescription(new RTCSessionDescription(sdp))
                callSocket.current.send(JSON.stringify({
                  type:'answer',
                  sdp:sdp,
                  channel_name:response.channel_name_sender,
                }))
              })
            })
          }
        }
        if (type == "getAnswer") {
          console.log('get answeer',response);
          let pc = pcs[response.channel_name]
          console.log(pc)
          console.log(pcs)
          if(pc){
            pc.setRemoteDiscription(new RTCSessionDescription(response.sdp))
          }
        }
        if (type == "getCandidate") {
          console.log('get candidate',response);
          let pc = pcs[response.channel_name_sender]
          console.log('get candidate',pc)
          console.log('get candidate',pcs)
          if(pc){
            pc.addIceCandidate(new RTCIceCandidate(response.candidate))
            .then(()=>{console.log('candidate yes')})
          }
        }
      };
  };
  
  useEffect(()=>{
      connectRoom()
  },[createPeerConnection,processCall])
  useEffect(()=>{
},[users])
  return (
     <div>
         <h1>room {data.data.group}</h1>
         <button onClick={()=>{
          console.log(localVideo)
          console.log(users)
          }}>user dla vlada</button>
         <video muted autoPlay ref={localVideo}></video>
         {users.length>0&&users.map((user,index)=>(
          <Video key={index} stream={user.stream} user={user}/>
         ))}
     </div>
  );
}

export default Room;