
// function Connection(){
//   let [myName, setMyName] = useState("");
//   let [perName, setName] = useState("");
//   let localVideo = useRef();
//   let peerConnection=useRef()


//   const call = () => {
//     let userToCall = perName;
//     otherUser = userToCall;
//     console.log(myName)

//     beReady().then((bool) => {
//       processCall(userToCall);
//     });
//   };

//   const answer = () => {
//     beReady().then((bool) => {
//       processAccept();
//     });
//   };

  
//   const processCall = (username) => {
//     peerConnection.current.createOffer(
//       (session) => {
//         peerConnection.current.setLocalDescription(session);
//         sendCall({
//           name: username,
//           rtcMessage: session,
//         });
//       },
//       (err) => {
//         console.log(err);
//       }
//     );
//   };

//   const sendCall = (data) => {
//     console.log("sendCall");
//     callSocket.current.send(
//       JSON.stringify({
//         type: "call",
//         data,
//       })
//     );
//     //окошко вызова
//   };
//   const beReady = () => {
//     return navigator.mediaDevices.getUserMedia({
//      audio: true,
//      video: true,
//    }).then((stream)=>{
//    localStream = stream;
//    localVideo.current.srcObject = stream;
//    return createConnectionAndAddStream();
//  }).catch( (err)=>{
//    console.log(err);
//  })
// };

// const createConnectionAndAddStream = () => {
//     createPeerConnection();
//     peerConnection.current.addStream(localStream);
//     return true;
//   };

//   const createPeerConnection = () => {
//     try {
//       peerConnection.current = new RTCPeerConnection(config);
//       peerConnection.current.onicecandidate = handleIceCandidate;
//       peerConnection.current.onaddstream = handleRemoteStreamAdded;
//       peerConnection.current.onremovestream = handleRemoteStreamRemoved;
//       console.log("create rtc peer connection");
//       return;
//     } catch (e) {
//       console.log("faild peer ", e.message);
//       return;
//     }
//   };

//   const connectSocket = () => {
//     callSocket.current=new WebSocket("wss://rims.by/room/");
//     callSocket.current.onopen = (e) => {
//       console.log('onopen')
//       callSocket.current.send(
//         JSON.stringify({
//           type: "login",
//           data: {
//             name: myName,
//           },
//         })
//       );
//     };
//     callSocket.current.onmessage = (e) => {
//         let response = JSON.parse(e.data);
//         let type = response.type;
  
//         console.log(response)
//         if (type == "connection") {
//           console.log(response.data.message);
//         }
//         if (type == "call_received") {
//           onNewCall(response.data);
//         }
//         if (type == "call_answered") {
//           onCallAnswered(response.data);
//         }
//         if (type == "ICEcandidate") {
//           onICECandidate(response.data);
//         }
//       };
// }

// const onNewCall=(data)=>{
//     otherUser=data.caller
//     remoteRtcMessage=data.rtcMessage
//   }

//   const onCallAnswered=(data)=>{
//     remoteRtcMessage=data.rtcMessage
//     peerConnection.current.setRemoteDescription(new RTCSessionDescription(remoteRtcMessage))
//     callProgress()
//   }

//   const onICECandidate=(data)=>{
//     let message=data.rtcMessage
//     let candidate=new RTCIceCandidate({
//       sdpMLineIndex:message.label,
//       candidate:message.candidate
//     })
//     if(peerConnection.current){
//       peerConnection.current.addIceCandidate(candidate)
//     }else{
//       iceCandidatesFromCaller.push(candidate)
//     }
//   }

//   const handleIceCandidate = (e) => {
//     if (e.candidate) {
//       console.log("local ice candidate");
//       sendIceCandidate({
//         user: otherUser,
//         rtcMessage: {
//           label: e.candidate.sdpMLineIndex,
//           id: e.candidate.sdpMid,
//           candidate: e.candidate.candidate,
//         },
//       });
//     } else {
//       console.log("end candidate");
//     }
//   };

//   const sendIceCandidate = (data) => {
//     console.log("send ice candadati",callSocket);
//     callSocket.current.send(
//       JSON.stringify({
//         type: "ICEcandidate",
//         data,
//       })
//     );
//   };

//   const login =()=>{
//     connectSocket()
//   }
// return(
// <div>
// <label>who</label>
//       <input
//         onChange={(e) => {
//           setMyName(e.target.value);
//         }}
//         value={myName}
//       />
//       <div onClick={login}>login</div>

//       <label>whom</label>
//       <input
//         onChange={(e) => {
//           setName(e.target.value);
//         }}
//         value={perName}
//       />
//       <div onClick={call}>call</div>

//       <div onClick={answer}>answer</div>

//       <video muted autoPlay ref={localVideo}></video>
// </div>
// )
// }

// export default Connection;