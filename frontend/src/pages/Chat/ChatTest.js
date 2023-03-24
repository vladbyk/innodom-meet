import React, {useState, useEffect, useRef} from "react";

const WebRTCVideoConference = () => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);
    const [peerConnections, setPeerConnections] = useState([]);
    const [roomId, setRoomId] = useState("1");

    const localVideoRef = useRef(null);
    const remoteVideosRef = useRef([]);

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
        const createPeerConnection = (index) => {
            const peer = new RTCPeerConnection({
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
            });

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    const candidate = event.candidate;
                    // send candidate to other peers
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

            console.log(peer)
            setPeerConnections((prev) => {return [...prev, peer]});
            console.log(peerConnections)
        };

        const handleJoinRoom = () => {
            const socket = new WebSocket(`wss://rims.by/ws/videoconference/${roomId}/`);
            socket.onopen = () => {
                console.log("WebSocket connection established");
                socket.send(JSON.stringify({type: "join_room", roomId}));
            };
            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                switch (message.type) {
                    case "joined_room":
                        console.log(`Joined room ${message.room_id}`);
                        break;
                    case "peer_joined":
                      console.log(event)
                      console.log(message)
                        console.log(`Peer ${message.peer_id} joined the room`);
                        createPeerConnection(remoteStreams.length);
                        console.log(remoteStreams)
                        console.log('peerConn',peerConnections)
                        peerConnections[remoteStreams.length].createOffer().then((offer) => {
                            peerConnections[remoteStreams.length].setLocalDescription(offer);
                            socket.send(
                                JSON.stringify({
                                    type: "offer",
                                    offer,
                                    receiver: message.peer_id,
                                })
                            );
                        });
                        break;
                    case "offer":
                        console.log("Received offer from peer", message.sender);
                        console.log("mess", message);
                        const peerOffer = peerConnections.find((p) => p.localDescription.sdp === message.offer.sdp);
                        console.log(peerOffer)
                        console.log(peerConnections)
                        peerOffer.setRemoteDescription(new RTCSessionDescription(message.offer));
                        peerOffer.createAnswer().then((answer) => {
                            peerOffer.setLocalDescription(answer);
                            socket.send(
                                JSON.stringify({
                                    type: "answer",
                                    answer,
                                    receiver: message.sender,
                                })
                            );
                        });
                        break;
                    case "answer":
                        console.log("Received answer from peer", message.sender);
                        const peerAnswer = peerConnections.find((p) => p.connectionId === message.sender);
                        peerAnswer.setRemoteDescription(new RTCSessionDescription(message.answer));
                        break;
                    case "candidate":
                        console.log("Received candidate from peer", message.sender);
                        const peerCandidate = peerConnections.find((p) => p.connectionId === message.sender);
                        peerCandidate.addIceCandidate(new RTCIceCandidate(message.candidate));
                        break;
                    case "peer_left":
                        console.log(`Peer ${message.peer_id} left the room`);
                        const index = remoteStreams.findIndex((stream) => stream.peer_id === message.peer_id);
                        if (index !== -1) {
                            const updatedRemoteStreams = [...remoteStreams];
                            updatedRemoteStreams.splice(index, 1);
                            setRemoteStreams(updatedRemoteStreams);
                            const updatedPeerConnections = [...peerConnections];
                            updatedPeerConnections.splice(index, 1);
                            setPeerConnections(updatedPeerConnections);
                            const videoElement = remoteVideosRef.current[index];
                            if (videoElement) {
                                videoElement.srcObject = null;
                            }
                        }
                        break;
                    default:
                        break;
                }
            };
            return () => {
                socket.close();
            };
        };
        handleJoinRoom();
    }, [roomId, localStream, peerConnections, remoteStreams]);

    const handleRoomIdChange = (event) => {
        setRoomId(event.target.value);
    };

    const handleLeaveRoom = () => {
// send leave room message to server and close peer connections
        peerConnections.forEach((peer) => peer.close());
        setPeerConnections([]);
        setRemoteStreams([]);
    };

    return (
        <div>
            <h1>WebRTC Video Conference</h1>
            <div>
                <label htmlFor="room-id-input">Room ID:</label>
                <input
                    id="room-id-input"
                    type="text"
                    value={roomId}
                    onChange={handleRoomIdChange}
                />
                <button onClick={handleLeaveRoom}>Leave Room</button>
            </div>
            <div>
                <h2>Local Stream</h2>
                <video ref={localVideoRef} autoPlay playsInline muted/>
            </div>
            <div>
                <h2>Remote Streams</h2>
                {remoteStreams.map((stream, index) => (
                    <video key={stream.peer_id} ref={(el) => (remoteVideosRef.current[index] = el)} autoPlay
                           playsInline/>
                ))}
            </div>
        </div>
    );
};

export default WebRTCVideoConference;
