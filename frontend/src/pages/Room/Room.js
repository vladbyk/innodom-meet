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

  useEffect(()=>{
    console.log('rerender')
},[users])

console.log('data role',data.data.role)
const [recorder, setRecorder] = useState(null);

// const startScreenRecording=()=>{
//   // if(data.data.role=='T'){}
//   navigator.mediaDevices.getDisplayMedia({
//     video:true,
//     audio:true
//   }).then(stream=>{
//     let streams=[]
//       console.log(users)
//       users.map(i=>{streams.push(i.stream)})
//       // streams.push(stream)
//       console.log(streams)
//       let RecordMediaStream= new MediaStream()
//       console.log(stream.getVideoTracks())
//       RecordMediaStream.addTrack(stream.getVideoTracks()[0])

//       navigator.mediaDevices.getUserMedia({video:false,audio:true})
//       .then(audio=>{
//         RecordMediaStream.addTrack(audio.getAudioTracks()[0])
//       })
//       streams.forEach(item=>{
//         console.log(item.getAudioTracks())
//         RecordMediaStream.addTrack(item.getAudioTracks()[0])
//       })
//       console.log(RecordMediaStream)
//       let screenRecorder = new RecordRTC(RecordMediaStream,{mimeType:'video/webm' })

//       screenRecorder.startRecording()
//       // const ConferenceRecorder = ({streams}) => {
      
//           // Ищем MediaStream с экраном, чтобы записывать его
//           // const screenStream = stream
//           // s.find(streamMy => {
//           //   return streamMy.getVideoTracks().length && streamMy.getVideoTracks()[0].label === 'screen';
//           // });
//           // if (!screenStream) {
//           //   console.log('Не удалось найти MediaStream с экраном');
//           //   return;
//           // }
      
//           // Создаем RecordRTC для записи экрана
//           // const screenRecorder = new RecordRTC(screenStream, { type: 'video' });
      
//           // // Создаем AudioContext и объединяем звук всех MediaStream
//           // const audioContext = new AudioContext();
//           // const audioSources = [];
//           // const outputNode = audioContext.createMediaStreamDestination();
//           // streams.forEach(stream => {
//           //   stream.getAudioTracks().forEach(track => {
//           //     const audioStream = new MediaStream();
//           //     audioStream.addTrack(track);
//           //     const audioSource = audioContext.createMediaStreamSource(audioStream);
//           //     console.log(audioSource)
//           //     audioSource.connect(outputNode);
//           //     audioSources.push(audioSource);
//           //   });
//           // });

      
//           // // Начинаем запись
//           // screenRecorder.startRecording();
//           // setRecorder(screenRecorder);
      
//           // Отключаем звук через 10 секунд
//           // const timeout = 
//           setTimeout(() => {
//             screenRecorder.stopRecording(() => {
//               const blob = screenRecorder.getBlob();
//               invokeSaveAsDialog(blob, 'conference.webm');
//             });
//           }, 10000);
      
//           // return () => {
//             // При размонтировании компонента останавливаем запись и очищаем timeout
//             // if (recorder) {
//             //   recorder.stopRecording();
//             //   setRecorder(null);
//             // }
//             // clearTimeout(timeout);
//           // };
      
//         // return null;
//       // };
//       // ConferenceRecorder(streams)
     
//   }).catch(err=>console.log(err))

// //   setTimeout(()=>{
// //     recorder.stopRecording(function() {
// //         let blob = recorder.getBlob();
// //         invokeSaveAsDialog(blob,'video.mp4');
// //     });
// // },10000)

// //   navigator.mediaDevices.getDisplayMedia({
// //     video:true,
// //     audio:true
// //   }).then(async function(stream) {
// //     let recorder = RecordRTC([stream], {
// //         type: 'video',
// //         recorderType: MultiStreamRecorder, 
// //         disableLogs: true, 
// //         numberOfAudioChannels: 1, 
// //         bufferSize: 0, 
// //         sampleRate: 0, 
// //         desiredSampRate: 16000, 
// //         video: HTMLVideoElement
// //     });
// //     recorder.startRecording();

// //     const sleep = m => new Promise(r => setTimeout(r, m));
// //     await sleep(3000);

// //   //   let options = {
// //   //     mimeType: 'video/webm'
// //   // }

// //   //   let recorder= new MultiStreamRecorder([stream],options)
// //   //   recorder.record()

// //   let testArr=[]
// //   console.log(users)
// //   users.map(i=>{testArr.push(i.stream)})
// //   console.log(testArr)
// // setTimeout(()=>{
// // //   recorder.stop(function(blob) {
// // //     invokeSaveAsDialog(blob,'video.webm');
// // // });
// //     recorder.stopRecording(function() {
// //         let blob = recorder.getBlob();
// //         invokeSaveAsDialog(blob,'video.mp4');
// //     });
// // },15000)
   
// // });

// }


// useEffect(()=>{
//   if(data.data.role=='S'){
//     console.log('yes')
// }
// },[])
// useEffect(() => {
//   if(data.data.role=='T'){
//     let recordRTC=useRef();
//     if(localStream!==undefined && pcsShearing==undefined && localDisplayVideo==undefined){
//       recordRTC = RecordRTC([localStream], {
//       type: 'video',
//       mimeType: 'video/webm',
//     });
//     }else if(localStream!==undefined && pcsShearing!==undefined && localDisplayVideo==undefined){
//       recordRTC = RecordRTC([localStream].concat(pcsShearing), {
//         type: 'video',
//         mimeType: 'video/webm',
//     });
//     }else if(localStream!==undefined && pcsShearing!==undefined && localDisplayVideo!==undefined){
//       recordRTC = RecordRTC([localStream].concat(pcsShearing).concat([localDisplayVideo]), {
//         type: 'video',
//         mimeType: 'video/webm',
//     });
//     }
    

//     recordRTC.startRecording();

//     setRecorder(recordRTC);

//     recordRTC.on('dataavailable', (blob) => {
//       setRecordedBlobs((prevBlobs) => prevBlobs.concat(blob));
//     });

//   return () => {
//     if (recorder) {
//       recorder.stopRecording(() => {
//         const blob = new Blob(recordedBlobs, { type: 'video/webm' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.style.display = 'none';
//         a.href = url;
//         a.download = `${data.data.group}.webm`;
//         document.body.appendChild(a);
//         a.click();
//         setTimeout(() => {
//           document.body.removeChild(a);
//           URL.revokeObjectURL(url);
//         }, 100);
//       });
//     }
//   };
// }
// }, [pcsShearing, localStream, localDisplayVideo, recorder, recordedBlobs]);
const startScreenRecording = () => {
  navigator.mediaDevices.getDisplayMedia({
      video: true, audio: false
  }).then(stream => {
      let streams = []
      console.log(users)
      streams.push(stream)
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
      let screenRecorder = new RecordRTC(streams, {type: 'video', numberOfAudioChannels: 2})

      screenRecorder.startRecording()
      setTimeout(() => {
          screenRecorder.stopRecording(() => {
              console.log('enddd')
              const blob = screenRecorder.getBlob();
              invokeSaveAsDialog(blob, 'conference.mp4');
          });
      }, 10000);
          })
      // streams.forEach(item => {
      //     console.log(item.getAudioTracks())
      //     RecordMediaStream.addTrack(item.getAudioTracks()[0])
      // })
      

  }).catch(err => console.log(err))
}

  return (
     <div className="room-all">
      {/* <video ref={videoRef} autoPlay /> */}
         {/* <h1>room {data.data.group}</h1> */}
         {/* {isCandidate&&<div>hi</div>} */}
         <div className="video-panel">
          <div className="video-panel-upper">
            <div className="my-video">
         <video muted autoPlay ref={localVideo}></video>
         {/* <span className="my-name-icon">{data.data.name[0].toUpperCase()}</span> */}
         {/* <span className="my-name"><img className="icon-mic" src={microIcon} alt="micro"/>{data.data.name}</span> */}
         </div>
         <div className="users-video">
         {users.length>0&&users.map((user,index)=>(
          <>
          <Video key={index} stream={user.stream} user={user}/>
          {/* <Video key={index} stream={user.stream} user={user}/>
          <Video key={index} stream={user.stream} user={user}/>
          <Video key={index} stream={user.stream} user={user}/>
          <Video key={index} stream={user.stream} user={user}/> */}
          </>
         ))}
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
        <span onClick={startScreenRecording}>запись</span>
        {/* <span onClick={stopRecording}>запись</span> */}
        </div>

         <button className="btn-exit" onClick={exitRoom}>Завершить</button>
         </div>
     </div>
  );
}

export default Room;