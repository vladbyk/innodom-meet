import React, { useState, useEffect, useRef } from "react";

const WebRTCVideoConference = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [peerConnections, setPeerConnections] = useState([]);
  const [roomId, setRoomId] = useState("1");

  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef([]);


  //задаем локальный стрим разрешаем при загрузке микрофон и камеру
  useEffect(() => {
    const getLocalStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;
    };
    getLocalStream();
  }, []);

  useEffect(() => {
    //устанавливаем соединение к стан серверу
    const createPeerConnection = (index) => {
      const peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });
      setPeerConnections((prev) => [...prev, peer]);

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate;
          // раздача кондидатов
        }
      };

      peer.ontrack = (event) => {
        const remoteVideo = remoteVideosRef.current[index];
        if (remoteVideo) {
          remoteVideo.srcObject = event.streams[0];
        }
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peer.addTrack(track, localStream);
        });
      }

      return peer;
    };

    if (localStream) {
      //если включена камера подрубаем сокеты
      const socket = new WebSocket(
        `wss://rims.by/ws/videoconference/${roomId}/`
      );
      socket.onopen = () => {
        console.log("WebSocket connection established");
        socket.send(JSON.stringify({ type: "join_room", roomId }));
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "joined_room":
            console.log(`Joined room ${message.roomId}`);
            break;
          case "peer_joined":
            console.log(`Peer ${message.peerId} joined the room`);
            const peerConnection = createPeerConnection(remoteStreams.length);
            peerConnection.createOffer().then((offer) => {
              peerConnection.setLocalDescription(offer);
              socket.send(
                JSON.stringify({
                  type: "offer",
                  peerId: message.peerId,
                  offer,
                })
              );
            });
            setRemoteStreams((prev) => [...prev, null]);
            break;
          case "offer":
            console.log(`Received offer from peer ${message.peerId}`);
            const peerConnection2 = createPeerConnection(remoteStreams.length);
            peerConnection2.setRemoteDescription(
              new RTCSessionDescription(message.offer)
            );
            peerConnection2.createAnswer().then((answer) => {
              peerConnection2.setLocalDescription(answer);
              socket.send(
                JSON.stringify({
                  type: "answer",
                  peerId: message.peerId,
                  answer,
                })
              );
            });
            setRemoteStreams((prev) => [...prev, null]);
            break;
          case "answer":
            console.log(`Received answer from peer ${message.peerId}`);
            const peerConnection3 = peerConnections[message.peerId];
            peerConnection3.setRemoteDescription(
              new RTCSessionDescription(message.answer)
            );
            break;
          case "candidate":
            console.log(`Received candidate from peer ${message.peerId}`);
            const peerConnection4 = peerConnections[message.peerId];
            peerConnection4.addIceCandidate(
              new RTCIceCandidate({
                sdpMLineIndex: message.candidate.sdpMLineIndex,
                candidate: message.candidate.candidate,
              })
            );
            break;
          case "peer_left":
            console.log(`Peer ${message.peerId} left the room`);
            const peerConnection5 = peerConnections[message.peerId];
            if (peerConnection5) {
              peerConnection5.close();
              setPeerConnections((prev) => {
                prev.splice(message.peerId, 1);
                return [...prev];
              });
            }
            setRemoteStreams((prev) => {
              prev.splice(message.peerId, 1);
              return [...prev];
            });
            break;
          default:
            console.warn(`Unknown message type: ${message.type}`);
            break;
        }
      };
      return () => {
        socket.close();
        peerConnections.forEach((peer) => peer.close());
      };
    }
  }, [localStream, roomId, peerConnections]);

  const handleJoinRoom = () => {
    // connect to signaling server and join the specified room
  };

  return (
    <div>
      <h1>WebRTC Video Conference</h1>
      <div>
        <video ref={localVideoRef} autoPlay muted />
        {remoteStreams.map((stream, index) => (
          <video
            key={index}
            ref={(video) => (remoteVideosRef.current[index] = video)}
            autoPlay
          />
        ))}
      </div>
      <div>
        <label htmlFor="room-id-input">Room ID:</label>
        <input
          id="room-id-input"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={handleJoinRoom}>Join Room</button>
      </div>
    </div>
  );
};

export default WebRTCVideoConference;
