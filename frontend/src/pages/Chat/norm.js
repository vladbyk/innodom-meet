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
    const socketRef = useRef()
    const localStreamRef = useRef()
    const sendPCRef = useRef()
    const receiveRCsRef = useRef({})
    const [users,setUsers]=useState([])

    const localVideoRef=useRef(null)

    const closeReceivePC = useCallback((id)=>{
        if(!receiveRCsRef.current[id]) return;
        receiveRCsRef.current[id].close()
        delete receiveRCsRef.current[id]
    })

    const createReceiverOffer = useCallback(
        async (pc,senderSocketID)=>{
            try{
                const sdp = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                })
                console.log('receiv offer',pc)
                await pc.setLocalDescription(new RTCSessionDescription(sdp))
                if(!socketRef.current) return;
                socketRef.current.send(JSON.stringify({
                    sdp,
                    receiverSocketID: socketRef.current.id,
                    senderSocketID,
                    roomID:data.group,
                    type:'receiverOffer'
                }))
            }catch(err){
                console.log(err)
            }
        },
        []
    )

    const createReceiverPeerConnection=useCallback((socketID)=>{
        try{
            const pc= new RTCPeerConnection(pc_config)
            pc.onicecandidate=(e)=>{
                if(!(e.candidate && socketRef.current)) return;
                console.log('onicecandidate',e)
                socketRef.current.send(JSON.stringify({
                    candidate:e.candidate,
                    receiverSocketID: socketRef.current.id,
                    senderSocketID: socketID,
                    type:'receiverCandidate'
                }))
            }
            pc.onconnectionstatechange=(e)=>{
                console.log('onconn',e)
            }
            pc.ontrack=(e)=>{
                console.log('ontrac',e)
                setUsers((oldUsers)=>{
                    oldUsers
                    .filter((user)=>user.id !==socketID)
                    .concat({
                        id:socketID,
                        stream:e.streams[0]
                    })
                })
            }
            return pc;
        }catch (e){
            console.error(e)
            return undefined
        }
    },[])

    const createReceivePC = useCallback((id)=>{
        try{
            console.log('createReceive',id)
            if(!(socketRef.current&&pc)) return;
            createReceiverOffer(pc,id)
        }catch(error){
            console.log(error)
        }
    }, [createReceiverOffer, createReceiverPeerConnection])

    const createSenderOffer = useCallback(async () => {
        try {
          if (!sendPCRef.current) return;
          const sdp = await sendPCRef.current.createOffer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: false,
          });
          console.log("create sender offer success");
          await sendPCRef.current.setLocalDescription(
            new RTCSessionDescription(sdp)
          );
    
          if (!socketRef.current) return;
          socketRef.current.send(JSON.stringify({
            sdp,
            senderSocketID: socketRef.current.id,
            roomID: data.group,
            type:'senderOffer',
          }));
        } catch (error) {
          console.log(error);
        }
      }, []);
    
      const createSenderPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection(pc_config);
    
        pc.onicecandidate = (e) => {
          if (!(e.candidate && socketRef.current)) return;
          console.log("sender PC onicecandidate");
          socketRef.current.send(JSON.stringify({
            candidate: e.candidate,
            senderSocketID: socketRef.current.id,
            type:'senderCandidate'
          }));
        };
    
        pc.oniceconnectionstatechange = (e) => {
          console.log(e);
        };
    
        if (localStreamRef.current) {
          console.log("add local stream");
          localStreamRef.current.getTracks().forEach((track) => {
            if (!localStreamRef.current) return;
            pc.addTrack(track, localStreamRef.current);
          });
        } else {
          console.log("no local stream");
        }
    
        sendPCRef.current = pc;
      }, []);
    
      const getLocalStream = useCallback(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
              width: 240,
              height: 240,
            },
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          if (!socketRef.current) return;
    
          createSenderPeerConnection();
          await createSenderOffer();
    
          socketRef.current.send(JSON.stringify({
            id: socketRef.current.id,
            roomID: data.group,
            type:'joinRoom'
          }));
        } catch (e) {
          console.log(`getUserMedia error: ${e}`);
        }
      }, [createSenderOffer, createSenderPeerConnection]);
    
      useEffect(() => {
        socketRef.current = new WebSocket(`wss://rims.by/room/${data.group}`);;
        getLocalStream();
    
        socketRef.current.on("userEnter", (data) => {
          createReceivePC(data.id);
        });
    
        socketRef.current.on(
          "allUsers",
          (data) => {
            data.users.forEach((user) => createReceivePC(user.id));
          }
        );
    
        socketRef.current.on("userExit", (data) => {
          closeReceivePC(data.id);
          setUsers((users) => users.filter((user) => user.id !== data.id));
        });
    
        socketRef.current.on(
          "getSenderAnswer",
          async (data) => {
            try {
              if (!sendPCRef.current) return;
              console.log("get sender answer");
              console.log(data.sdp);
              await sendPCRef.current.setRemoteDescription(
                new RTCSessionDescription(data.sdp)
              );      
            } catch (error) {
              console.log(error);
            }
          }
        );

        socketRef.current.on(
          "getSenderOffer",
          async (data) => {
            try {
              if (!sendPCRef.current) return;
              console.log("get sender offer");
              console.log(data);
              let pc= createReceiverPeerConnection(data.senderSocketID,socketRef.current,data.roomID)
              await pc.setRemoteDescription(data.sdp)
              let sdp=await pc.createAnswer({
                offerToReceiveAudio:true,
                offerToReceiveVideo:true,
              })
              await pc.setLocalDescription(sdp)
              socketRef.current.send(JSON.stringify({
                sdp,
                senderSocketID: socketRef.current.id,
                roomID: data.group,
                type:'senderAnswer'
              }));
            } catch (error) {
              console.log(error);
            }
          }
        );
    
        socketRef.current.on(
          "getSenderCandidate",
          async (data) => {
            try {
              if (!(data.candidate && sendPCRef.current)) return;
              console.log("get sender candidate");
              await sendPCRef.current.addIceCandidate(
                new RTCIceCandidate(data.candidate)
              );
              console.log("candidate add success");
            } catch (error) {
              console.log(error);
            }
          }
        );
    
        socketRef.current.on(
          "getReceiverAnswer",
          async (data) => {
            try {
              console.log(`get socketID(${data.id})'s answer`);
              const pc = receiveRCsRef.current[data.id];
              if (!pc) return;
              await pc.setRemoteDescription(data.sdp);
              console.log(`socketID(${data.id})'s set remote sdp success`);
            } catch (error) {
              console.log(error);
            }
          }
        );
    
        socketRef.current.on(
          "getReceiverCandidate",
          async (data) => {
            try {
              console.log(data);
              console.log(`get socketID(${data.id})'s candidate`);
              const pc = receivePCsRef.current[data.id];
              if (!(pc && data.candidate)) return;
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              console.log(`socketID(${data.id})'s candidate add success`);
            } catch (error) {
              console.log(error);
            }
          }
        );
    
        return () => {
          if (socketRef.current) {
            socketRef.current.disconnect();
          }
          if (sendPCRef.current) {
            sendPCRef.current.close();
          }
          users.forEach((user) => closeReceivePC(user.id));
        };
        // eslint-disable-next-line
      }, [
        closeReceivePC,
        createReceivePC,
        createSenderOffer,
        createSenderPeerConnection,
        getLocalStream,
      ]);
    
      return (
        <div>
          <video
            style={{
              width: 240,
              height: 240,
              margin: 5,
              backgroundColor: "black",
            }}
            muted
            ref={localVideoRef}
            autoPlay
          />
          {users.map((user, index) => (
            <Video key={index} stream={user.stream} />
          ))}
        </div>
      );
   
}

export default Room;