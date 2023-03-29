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
  // const createConnectionAndAddStream = () => {
  // // createPeerConnection();
  // peerConnection.current.addStream(localStream);
  // return true;
  // };
  const createPeerConnection = (socketID,localStream,email) => {
  let pc=new RTCPeerConnection(pc_config)
  pcs={...pcs,[socketID]:pc}

  console.log(pc)
  pc.onicecandidate=(e)=>{
    if(e.candidate){
    console.log('on ice cang',e)
            callSocket.current.send(JSON.stringify({
              candidate: e.candidate,
              chanel_name:socketID,
              type:'candidate'
            }))}
  }

  pc.ontrack=(e)=>{
    setUsers((oldUsers)=>[...oldUsers,{email:email,id:socketID,stream:e.streams[0]}])
    console.log(users)
  }

  if(localStream){
    localStream.getTracks().forEach(track=>{
      pc.addTrack(track,localStream)
    })
  }else{console.log('no local stream')}

  return pc;
  };
  //   const handleRemoteStreamAdded = (event) => {
  //     console.log("Remote stream added.");
  //     console.log(event.stream)
  //     console.log(localStream)
  //     remoteStream = event.stream;
  //     remoteVideo.current.srcObject = remoteStream;
  //   };
  
  const processCall = (username) => {
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

  // pc.createOffer({
  //   offerToReceiveAudio: true,
  //   offerToReceiveVideo: true,
  // })
  // .then(sdp=>{
  //   console.log('create off ',sdp)

  // })

  // peerConnection.current.createOffer(
  //   (session) => {
  //     peerConnection.current.setLocalDescription(session);
  //     console.log(session)
  //     console.log(peerConnection)
  //     callSocket.current.send(JSON.stringify({
  //       type:'senderOffer',
  //       user:data.data.id,
  //       sdp:session.sdp,
  //     }))
  //   },
  //   (err) => {
  //     console.log(err);
  //   }
  // );
  }
  const connectRoom = () => {
      console.log('sok',data.data)
      callSocket.current = new WebSocket(`wss://rims.by/ws/room/${data.data.group}/?user=${data.data.id}`);
      callSocket.current.onopen = () => {
          console.log("WebSocket connection established");
          beReady().then((bool)=>{
              processCall()
          })
          // socket.send(JSON.stringify({type: "join_room", roomId}));
      };

      callSocket.current.onmessage = (e) => {
        let response = JSON.parse(e.data);
        let type = response.type;
        if (type == "getJoinRoom") {
          console.log('get join room',response);
          if(response.length>0){
            response.map(item=>{
              createPeerConnection(item.chanel_name,item.email,localStream)
              let pc=pcs[item.chanel_name]
              if(pc){
  pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  })
  .then(sdp=>{
    console.log('create off ',sdp)
    pc.setLocalDescription(new RTCSessionDescription(sdp))
    callSocket.current.send(JSON.stringify({
      type:'offer',
      sdp:sdp,
      chanel_name:item.chanel_name
    }))
  })
  .catch(err=>console.log(err))
              }
            })
          }
        }
        if (type == "getOffer") {
          console.log('get sender offer',response);
          createPeerConnection(response.chanel_name,response.email,localStream)
          let pc = pcs[response.chanel_name]
          if(pc){
            pc.setRemoteDiscription(new RTCSessionDescription(response.sdp))
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
                  chanel_name:response.chanel_name
                }))
              })
            })
          }
        }
        if (type == "getAnswer") {
          console.log('get answeer',response);
          let pc = pcs[response.chanel_name]
          if(pc){
            pc.setRemoteDiscription(new RTCSessionDescription(response.sdp))
          }
        }
        if (type == "getCandidate") {
          console.log('get candidate',response);
          let pc = pcs[response.chanel_name]
          if(pc){
            pc.addIceCandidate(new RTCIceCandidate(response.candidate))
            .then(()=>{console.log('candidate yes')})
          }
        }
        console.log(users)
        // if (type == "getSenderOffer") {
        //   console.log('get sender offer',response);
        //   let pc=new RTCPeerConnection(pc_config)
        //   pc.onicecandidate=(e)=>{
        //     console.log('on ice cang',e)
        //     callSocket.current.send(JSON.stringify({
        //       candidate: e.candidate,
        //       chanel_name:data.data.chanel_name,
        //       type:'senderCandidate'
        //     }))
        //   }

        //   pc.ontrack=(e)=>{
        //     console.log('ontrac',e)
        //     e.streams[0]
        //   }
        // }

        // if (type == "getSenderCandidate") {
        //   console.log('get sender candidate',response);
        //     try {
        //       if (!(response.candidate && callSocket.current)) return;
        //       console.log("get sender candidate");
        //       callSocket.current.addIceCandidate(
        //         new RTCIceCandidate(response.candidate)
        //       );
        //       console.log("candidate add success");
        //     } catch (error) {
        //       console.log(error);
        //     }
        // }
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
         <h1>room {data.data.group}</h1>
         <video muted autoPlay ref={localVideo}></video>
     </div>
  );
}

export default Room;