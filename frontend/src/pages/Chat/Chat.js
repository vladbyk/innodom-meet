import { useEffect, useRef, useState } from "react";
// import logo from '../../assets/inno.png'
// import { Socket, io } from "engine.io-client";
import { w3cwebsocket } from "websocket";
import "./chat.css";

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
//   const SOCKET_SERVER_URL = "http://localhost:8080";

function Chat() {
  let [perName, setName] = useState('');
  // let localVideo = useRef();
  // let remoteVideo = useRef();
  let localVideo = useRef()
  let remoteVideo = useRef();
  let otherUser;
  let [myName, setMyName] = useState('');
  let localStream;
  let remoteStream;
  let peerConnection=useRef()
  let callSocket=useRef()
  let remoteRtcMessage;
  let iceCandidatesFromCaller = [];
  let [callProg, setCallProgress] = useState(false);

  const call = () => {
    let userToCall = perName;
    otherUser = userToCall;
    console.log(myName)

    beReady().then((bool) => {
      processCall(userToCall);
    });
  };

  const answer = () => {
    beReady().then((bool) => {
      processAccept();
    });
  };

  const connectSocket = () => {
    callSocket.current=new WebSocket("wss://rims.by/room/");
    callSocket.current.onopen = (e) => {
      console.log('onopen')
      callSocket.current.send(
        JSON.stringify({
          type: "login",
          data: {
            name: myName,
          },
        })
      );
    };

    callSocket.current.onmessage = (e) => {
      let response = JSON.parse(e.data);
      let type = response.type;

      console.log(response)
      if (type == "connection") {
        console.log(response.data.message);
      }
      if (type == "call_received") {
        onNewCall(response.data);
      }
      if (type == "call_answered") {
        onCallAnswered(response.data);
      }
      if (type == "ICEcandidate") {
        onICECandidate(response.data);
      }
    };
  };

  const onNewCall=(data)=>{
    otherUser=data.caller
    remoteRtcMessage=data.rtcMessage
  }

  const onCallAnswered=(data)=>{
    remoteRtcMessage=data.rtcMessage
    peerConnection.current.setRemoteDescription(new RTCSessionDescription(remoteRtcMessage))
    callProgress()
  }

  const onICECandidate=(data)=>{
    let message=data.rtcMessage
    let candidate=new RTCIceCandidate({
      sdpMLineIndex:message.label,
      candidate:message.candidate
    })
    if(peerConnection.current){
      peerConnection.current.addIceCandidate(candidate)
    }else{
      iceCandidatesFromCaller.push(candidate)
    }
  }

  const processAccept = () => {
    peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(remoteRtcMessage)
    );
    console.log(remoteRtcMessage)
    peerConnection.current.createAnswer()
    .then((session) => {
      peerConnection.current.setLocalDescription(session);
      console.log(iceCandidatesFromCaller)
      console.log(session)
      if (iceCandidatesFromCaller.length > 0) {
        for (let i = 0; i < iceCandidatesFromCaller.length; i++) {
          let candidate = iceCandidatesFromCaller[i];
          console.log('ice cand ')
          try {
            peerConnection.current
              .addIceCandidate(candidate)
              .then((done) => {
                console.log(candidate)
                console.log(done);
              })
              .catch((err) => console.log(err));
          } catch (err) {
            console.log(err);
          }
        }
        iceCandidatesFromCaller = [];
      }
      answerCall({
        name: myName,
        rtcMessage: session,
      });
    })
  };

  const answerCall = (data) => {
    callSocket.current.send(
      JSON.stringify({
        type: "answer_call",
        data,
      })
    );
    callProgress();
  };

  const callProgress = () => {
    setCallProgress(true);
  };

  const processCall = (username) => {
    peerConnection.current.createOffer(
      (session) => {
        peerConnection.current.setLocalDescription(session);
        sendCall({
          name: username,
          rtcMessage: session,
        });
      },
      (err) => {
        console.log(err);
      }
    );
  };

  const sendCall = (data) => {
    console.log("sendCall");
    callSocket.current.send(
      JSON.stringify({
        type: "call",
        data,
      })
    );
    //окошко вызова
  };

  const beReady = () => {
       return navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      }).then((stream)=>{
      localStream = stream;
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
      peerConnection.current.onicecandidate = handleIceCandidate;
      peerConnection.current.onaddstream = handleRemoteStreamAdded;
      peerConnection.current.onremovestream = handleRemoteStreamRemoved;
      console.log("create rtc peer connection");
      return;
    } catch (e) {
      console.log("faild peer ", e.message);
      return;
    }
  };

  const handleRemoteStreamAdded = (event) => {
    console.log("Remote stream added.");
    console.log(event.stream)
    console.log(localStream)
    remoteStream = event.stream;
    remoteVideo.current.srcObject = remoteStream;
  };
  const handleRemoteStreamRemoved = (event) => {
    console.log("Remote stream removed. Event: ", event);
    remoteVideo.current.srcObject = null;
    localVideo.current.srcObject = null;

    window.onbeforeunload=()=>{
      if(callProg){
        stop()
      }
    }
  };

  const stop=()=>{
    localStream.getTracks().forEach(track => {
      track.stop()
    });
    setCallProgress(false)
    peerConnection.current.close()
    peerConnection.current=null
    otherUser=null
  }

  const handleIceCandidate = (e) => {
    if (e.candidate) {
      console.log("local ice candidate");
      sendIceCandidate({
        user: otherUser,
        rtcMessage: {
          label: e.candidate.sdpMLineIndex,
          id: e.candidate.sdpMid,
          candidate: e.candidate.candidate,
        },
      });
    } else {
      console.log("end candidate");
    }
  };

  const sendIceCandidate = (data) => {
    console.log("send ice candadati",callSocket);
    callSocket.current.send(
      JSON.stringify({
        type: "ICEcandidate",
        data,
      })
    );
  };

  const login =()=>{
    connectSocket()
  }

  return (
    <div>
      <label>who</label>
      <input
        onChange={(e) => {
          setMyName(e.target.value);
        }}
        value={myName}
      />
      <div onClick={login}>login</div>

      <label>whom</label>
      <input
        onChange={(e) => {
          setName(e.target.value);
        }}
        value={perName}
      />
      <div onClick={call}>call</div>

      <div onClick={answer}>answer</div>

      <video muted autoPlay ref={localVideo}></video>
      <video autoPlay ref={remoteVideo}></video>
    </div>
  );
}

export default Chat;
