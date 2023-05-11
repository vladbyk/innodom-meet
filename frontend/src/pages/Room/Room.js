import React, {useState, useEffect, useRef, useCallback} from "react";
import Video from "./Video";
import './room.css'
import RecordRTC, { MultiStreamRecorder, StereoAudioRecorder, invokeSaveAsDialog } from "recordrtc";
import videoActive from '../../assets/icons/videoAction.svg'
import videoMuted from '../../assets/icons/videoMuted.svg'
import audioActive from '../../assets/icons/audioAction.svg'
import audioMuted from '../../assets/icons/audioMuted.svg'
import sharingActive from '../../assets/icons/sharingAction.svg'
import sharingNone from '../../assets/icons/sharingNone.svg'
import microIcon from '../../assets/icons/mikroIcon.svg'
import Carousel from "nuka-carousel"

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
const Room = (data, exitUser) => {
  let localVideo = useRef()
  let localStream;
  let peerConnection=useRef()
  let callSocket=useRef()
  let localDisplayVideo=useRef()
  let myStreamSharing=useRef()
  let pcs;
  const [users,setUsers]=useState([])
  const [isCandidate,setCandidate]=useState(false)
  const [isAudio,setAudio]=useState(true)
  const [isVideo,setVideo]=useState(true)
  const [isDispVideo,setDispVideo]=useState(false)
  const [isSharing,setSharing]=useState(false)
  const [pcsShearing,setPcsShearing]=useState()

  // const [recordedBlobs, setRecordedBlobs] = useState([]);
  // const videoRef = useRef(null);

  const beReady = () => {
      return navigator.mediaDevices.getUserMedia({
       audio: true,
       video: true,
     }).then((stream)=>{
     localStream = stream;
     console.log(stream)
     localVideo.current.srcObject = stream;
     const videoTracks=localVideo.current.srcObject.getVideoTracks()
     videoTracks.forEach((track)=>{
       track.enabled=false
     })
     setVideo(false)
     const audioTracks=localVideo.current.srcObject.getAudioTracks()
     audioTracks.forEach((track)=>{
       track.enabled=false
     })
     setAudio(false)
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
    let stream= e.streams[0]
    let tracks= stream.getTracks()
    let len= tracks.length
    console.log(tracks)
    console.log(e.streams)
    console.log(e.streams[0].getVideoTracks()[0].getSettings())
    if(len===2){
    setUsers((oldUsers)=>oldUsers.filter(user=>user.id!==socketID))
    setUsers(oldUsers=>{return[...oldUsers,{email:email,id:socketID,stream:e.streams[0]}]})
  }else{
    // setDispVideo(true)
    localDisplayVideo.current.srcObject=e.streams[0]
  }
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
      user:data.data.id,
      group:data.data.group
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
          // let myPcs = createPeerConnection(response.channel_name_sender,localStream,response.email)
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
                  group:data.data.group,
                  channel_name:response.channel_name_sender,
                }))
              })
            })
          }
        }
        if (type == "getCheckDeamon") {
          console.log('getCheckDeamon',response)
          console.log(pcs)
          console.log(myStreamSharing)
          let firstTrack=myStreamSharing.current.getTracks()[0]
          try{
          pcs[response.channel_name].addTrack(firstTrack,myStreamSharing.current)
          pcs[response.channel_name].createOffer()
            .then(offer=>{
              console.log('getCheckDeamons  send soffer');
              pcs[response.channel_name].setLocalDescription(offer)

          callSocket.current.send(JSON.stringify({
            type:'sharingOffer',
            user:data.data.id,
            group:data.data.group,
            sdp:offer,
            channel_name:response.channel_name
          }))
        })
      }catch{
        console.log('not a check demonstration')
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
        // if (type == "getSharing") {
        //   console.log('get sharing',response);
        //   console.log(pcs)
        //   // pcs[response.channel_name].onnegotiationneeded=(e)=>{
        //     // console.log('onnegotiationneeded',e);
        //     pcs[response.channel_name].createOffer()
        //     .then(offer=>{
        //       console.log('get sharing  send soffer');
        //       pcs[response.channel_name].setLocalDescription(offer)
        //       callSocket.current.send(JSON.stringify({
        //           type:'sharingOffer',
        //           user:data.data.id,
        //           group:data.data.group,
        //           sdp:offer
        //         })
        //       )
        //     })
        //     .catch(err=>console.log(err))
        //   // }
        // }
        if (type == "getSharingOffer") {
          console.log('get sharing offer',response);
          console.log('pcs',pcs);
          let pc = pcs[response.channel_name]
          if(pc){
            pc.setRemoteDescription(new RTCSessionDescription(response.sdp))
            .then(()=>{
              console.log('get sharing offer');
              pc.createAnswer({
                offerToReceiveAudio:false,
                offerToReceiveVideo:true
              }).then(sdp=>{
                pc.setLocalDescription(new RTCSessionDescription(sdp))
                callSocket.current.send(JSON.stringify({
                  type:'sharingAnswer',
                  user:data.data.id,
                  sdp:sdp,
                  channel_name:response.channel_name
                })
              )
              })
              
            })
            .catch(err=>console.log(err))
          }}
          if (type == "getSharingAnswer") {
            console.log('get sharing answer',response);
            console.log('pcs',pcs);
          let pc = pcs[response.channel_name]
            if(pc){
              pc.setRemoteDescription(new RTCSessionDescription(response.sdp))
            }
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
exitUser()
}
const screenSharing = ()=>{
  navigator.mediaDevices.getDisplayMedia({video:true,audio:false})
  .then((stream)=>{
    console.log(pcs)
    console.log(pcsShearing)
    console.log(stream)
    myStreamSharing.current=stream
    let firstTrack=stream.getTracks()[0]
    localDisplayVideo.current.srcObject=stream
    if(pcsShearing){
      Object.entries(pcsShearing).map(([key,pc])=>{
      pc.addTrack(firstTrack,stream)
      pc.createOffer()
            .then(offer=>{
              console.log('get sharing  send soffer');
              pc.setLocalDescription(offer)
              callSocket.current.send(JSON.stringify({
                  type:'sharingOffer',
                  user:data.data.id,
                  group:data.data.group,
                  sdp:offer,
                  channel_name:key
                })
              )
            })
    .catch(err=>console.log(err))
    }
    )}
  })
  setDispVideo(!isDispVideo)
}

const screenSharingStop = ()=>{
  const videoTracks=localDisplayVideo.current.srcObject.getVideoTracks()
          videoTracks.forEach((track)=>{
            track.stop()
          })
}
  
  useEffect(()=>{
      connectRoom()
  },[createPeerConnection,pcs])

console.log('data role',data.data.role)
let screenRecorder=useRef()
let emptyStream=useRef()

useEffect(()=>{
  if(data.data.role=='T'){
  navigator.mediaDevices.getDisplayMedia({
      video: true, audio: false
  }).then(stream => {
      let streams = []
      console.log(users)
      streams.push(stream)
      emptyStream.current=new MediaStream()
      streams.push(emptyStream.current)
      users.map(i => {
        let userStream = new MediaStream()
        i.stream.getAudioTracks().forEach(track=>userStream.addTrack(track))
        streams.push(userStream)
      })
      console.log(streams)

      navigator.mediaDevices.getUserMedia({video: false, audio: true})
          .then(audio => {
            console.log(audio.getTracks())
              streams.push(audio)
              console.log(streams)
      screenRecorder.current = new RecordRTC(streams, {
        type: 'video',
        mimeType:'video/mp4',
        disableLogs:true,
        timeSlice:1000,
        checkForInactiveTracks:false,
        bitsPerSecond:128000,
        audioBitsPerSecond:128000,
        videoBitsPerSecond:128000,
        sampleRate:96000,
        desiredSampRate:16000,
        bufferSize:16384,
        numberOfAudioChannels:2,
        video:{width:window.screen.width,height:window.screen.height},
        frameRate:90,
        bitrate:128000
      })

      screenRecorder.current.startRecording()

      setTimeout(()=>{
        screenRecorder.current.stopRecording(() => {
        console.log('enddd')
        const blob = screenRecorder.current.getBlob();
        invokeSaveAsDialog(blob, 'conference.mp4');
    });
      },10000)
      
      
          })      
  }).catch(err => console.log(err))
}
},[])
// const stopRecording=()=>{
//           screenRecorder.stopRecording(() => {
//               console.log('enddd')
//               const blob = screenRecorder.getBlob();
//               invokeSaveAsDialog(blob, 'conference.mp4');
//           });
//       }
useEffect(()=>{
  if(data.data.role=='T'&&users.length>0){
  console.log('new user to record')
  console.log(users[users.length-1].stream)
    // let userStream = new MediaStream()
    users[users.length-1].stream.getAudioTracks().forEach(track=>emptyStream.current.addTrack(track))
    
    // emptyStream.current.addTrack()
    // screenRecorder.current.addStreams([userStream])
  }
},[users])

  return (
     <div className="room-all">
         <div className="video-panel">
          <div className="video-panel-upper">
            <div className="my-video">
         <video muted autoPlay ref={localVideo}></video>
         {/* <span className="my-name-icon">{data.data.name[0].toUpperCase()}</span> */}
         {/* <span className="my-name"><img className="icon-mic" src={microIcon} alt="micro"/>{data.data.name}</span> */}
         </div>
         <div>
          <Carousel className="users-video" slidesToShow={4}>
         {users.length>0&&users.map((user,index)=>(
          <Video key={index} stream={user.stream} user={user}/>
         ))}
         </Carousel>
         </div>
         </div>
         {/* {isDispVideo&& */}
         <div className="display-video">
         <video muted autoPlay ref={localDisplayVideo}></video>
         </div>
        {/* } */}
         </div>
         
         <div className="panel-optional-all">
         <div className="media-track-panel">
         {isVideo ? <img src={videoActive} className="my-video-btn" alt="выкл видео" onClick={()=>{
          const videoTracks=localVideo.current.srcObject.getVideoTracks()
          videoTracks.forEach((track)=>{
            track.enabled=false
          })
          setVideo(false)
          }}/>
         :<img src={videoMuted} alt="вкл видео" className="my-video-btn" onClick={()=>{
          const videoTracks=localVideo.current.srcObject.getVideoTracks()
          videoTracks.forEach((track)=>{
            track.enabled=true
          })
          setVideo(true)
         }}/>}

         {isAudio ?
         <img src={audioActive} alt="audio выкл" onClick={()=>{
          const audioTracks=localVideo.current.srcObject.getAudioTracks()
          audioTracks.forEach((track)=>{
            track.enabled=false
          })
          setAudio(false)
        }}/>
         :
         <img src={audioMuted} alt="audio вкл" onClick={()=>{
          const audioTracks=localVideo.current.srcObject.getAudioTracks()
          audioTracks.forEach((track)=>{
            track.enabled=true
          })
          setAudio(true)
        }}/>
         }
         </div>

        <div className="option-panel">
        {isSharing ? 
         <img src={sharingActive} alt="screen sharing выкл" onClick={screenSharingStop}/>
         :
         <img src={sharingNone} alt="screen sharing вкл" onClick={screenSharing}/>
        }
        {/* <span onClick={stopRecording}>остановить запись</span> */}
        </div>

         <button className="btn-exit" onClick={exitRoom}>Завершить</button>
         </div>
     </div>
  );
}

export default Room;