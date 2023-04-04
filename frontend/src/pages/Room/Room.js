import React, {useState, useEffect, useRef, useCallback} from "react";
import Video from "./Video";
const pc_config = {
        iceServers: [
          {
            urls: "stun:stun.rims.by:3478",
          },
          {
            urls: "turn:turn.rims.by:3478",
            username: "innodom",
            credential: "innodom15988951"
          }
        ],
      };

const Room = (data) => {
  let localVideo = useRef()
  let localStream;
  let peerConnection=useRef()
  let callSocket=useRef()
  let localDisplayVideo=useRef()
  let pcs;
  const [users,setUsers]=useState([])
  const [isCandidate,setCandidate]=useState(false)
  const [isAudio,setAudio]=useState(true)
  const [isVideo,setVideo]=useState(true)
  const [isDispVideo,setDispVideo]=useState(false)
  const [pcsShearing,setPcsShearing]=useState()

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
  // setPcs({...pcs,socketID:pc})
  console.log(pcs)
  setPcsShearing(pcs)

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
    setCandidate(true)
  }
  if(localStream){
    console.log(localStream)
    localStream.getTracks().forEach(track=>{
      pc.addTrack(track,localStream)
    })
  }else{console.log('no local stream')}
  pc.ontrack=(e)=>{
    console.log('otrack',socketID)
    console.log('otrack',users)
    console.log('otrack',e)
    setUsers((oldUsers)=>oldUsers.filter(user=>user.id!==socketID))
    setUsers(oldUsers=>{return[...oldUsers,{email:email,id:socketID,stream:e.streams[0]}]})
    console.log(users)
  }

  return pc;
  },[]);
  
  const connectRoom = () => {
      console.log('sok',data.data)
      callSocket.current = new WebSocket(`wss://rims.by/ws/room/${data.data.group}/?user=${data.data.id}`);
      callSocket.current.onopen = () => {
          console.log("WebSocket connection established");
          beReady().then((bool)=>{
            callSocket.current.send(JSON.stringify({
              type:'joinRoom',
              group:data.data.group,
              user:data.data.id,
            }))
              // processCall()
          })
      };

      callSocket.current.onclose=()=>{
        console.log('close socket')
      }

    callSocket.current.onmessage = async(e) => {
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
  .then(async sdp=>{
    console.log('create off ',sdp)
    console.log(item)
    await pc.setLocalDescription(new RTCSessionDescription(sdp))
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
          createPeerConnection(response.channel_name_sender,localStream,response.email)
          let pc = pcs[response.channel_name_sender]
          if(pc){
            console.log(pc)
            console.log(pcs)
            await pc.setRemoteDescription(new RTCSessionDescription(response.sdp))
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
                  user:data.data.id,
                  channel_name:response.channel_name_sender,
                }))
              })
            })
          }
        }
        if (type == "getAnswer") {
          console.log('get answeer',response);
          let pc = pcs[response.channel_name]
          setCandidate(false)
          //возможно ченел нейм сендер
          console.log(pc)
          console.log(pcs)
          if(pc){
            pc.setRemoteDescription(new RTCSessionDescription(response.sdp))
          }
        }
        if (type == "getCandidate") {
          console.log('get candidate',response);
          let pc = pcs[response.channel_name_sender]
          console.log('get candidate',pc)
          console.log('get candidate',pcs)
          if(pc){
            await pc.addIceCandidate(new RTCIceCandidate(response.candidate))
            .then(()=>{
              console.log('candidate yes')})
          }
        }
        if (type == "getDisconnect") {
          console.log('get disconnect',response);
          console.log('pcs',pcs);
          pcs[response.channel_name].close()
          delete pcs[response.channel_name]
          setUsers((oldUsers)=>oldUsers.filter(user=>user.id!==response.channel_name))
        }
        if (type == "getSharing") {
          console.log('get sharing',response);
          console.log(pcs[response.channel_name].getTracks())
        }
      };
  };
  const exitRoom = ()=>{
  callSocket.current.send(JSON.stringify({
  type:'disconnect',
  user:data.data.id,
  group:data.data.group
}))
callSocket.current.close() 
}
const screenSharing = ()=>{
  navigator.mediaDevices.getDisplayMedia({video:true})
  .then((stream)=>{
    console.log(pcs)
    console.log(pcsShearing)
    pcsShearing.map(pc=>{
      stream.forEach(track=>{
      pc.addTrack(track,stream)
      })
    })
    callSocket.current.send(JSON.stringify({
    type:'sharing',
    user:data.data.id,
    group:data.data.group
  }))
  })
  setDispVideo(!isDispVideo)
}
  
  useEffect(()=>{
      connectRoom()
  },[createPeerConnection,pcs])
  useEffect(()=>{
    console.log('rerender')
},[users])
  return (
     <div>
         <h1>room {data.data.group}</h1>
         {isCandidate&&<div>hi</div>}
         <button onClick={exitRoom}>exit</button>
         <button onClick={screenSharing}>screen sharing</button>
         {isVideo ? <button onClick={()=>{
          const videoTracks=localVideo.current.srcObject.getVideoTracks()
          videoTracks.forEach((track)=>{
            track.enabled=false
          })
          setVideo(false)
          }}>выкл video</button>
         :<button onClick={()=>{
          const videoTracks=localVideo.current.srcObject.getVideoTracks()
          videoTracks.forEach((track)=>{
            track.enabled=true
          })
          setVideo(true)
         }}>вкл video</button>}
         {isAudio ?
         <button onClick={()=>{
          const audioTracks=localVideo.current.srcObject.getAudioTracks()
          audioTracks.forEach((track)=>{
            track.enabled=false
          })
          setAudio(false)
        }}>audio выкл</button>
         :
         <button onClick={()=>{
          const audioTracks=localVideo.current.srcObject.getAudioTracks()
          audioTracks.forEach((track)=>{
            track.enabled=true
          })
          setAudio(true)
        }}>audio вкл</button>
         }
         <video muted autoPlay ref={localVideo}></video>
         {isDispVideo&&
         <video muted width='300px' autoPlay ref={localDisplayVideo}></video>
         }
         {users.length>0&&users.map((user,index)=>(
          <Video key={index} stream={user.stream} user={user}/>
         ))}
     </div>
  );
}

export default Room;