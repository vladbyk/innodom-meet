import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { Button, Modal } from 'react-bootstrap';

const socket = io('http://localhost:8000');

const Conference = () => {
  const [myStream, setMyStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [showModal, setShowModal] = useState(false);

  const myVideoRef = useRef();
  const peersRef = useRef({});

  useEffect(() => {
    // get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setMyStream(stream);
        myVideoRef.current.srcObject = stream;

        // join the conference room
        socket.emit('join', { room: 'my-room' });

        // listen for new peer connections
        socket.on('user joined', ({ userId }) => {
          // create a new SimplePeer instance
          const peer = new SimplePeer({ initiator: true, stream });

          // listen for signaling messages from the server
          peer.on('signal', data => {
            socket.emit('signal', { userId, signal: data });
          });

          // add the peer to the peers dictionary
          peersRef.current[userId] = peer;
          setPeers(peersRef.current);

          // when the peer stream is ready, add it to the video conference
          peer.on('stream', stream => {
            const peerVideo = document.createElement('video');
            peerVideo.srcObject = stream;
            peerVideo.play();
            document.getElementById('peer-videos').appendChild(peerVideo);
          });
        });

        // listen for signaling messages from other peers
        socket.on('signal', ({ userId, signal }) => {
          const peer = peersRef.current[userId];
          if (peer) peer.signal(signal);
        });

        // listen for peer disconnections
        socket.on('user left', ({ userId }) => {
          const peer = peersRef.current[userId];
          if (peer) peer.destroy();
          delete peersRef.current[userId];
          setPeers(peersRef.current);
        });
      })
      .catch(error => {
        console.error(error);
        setShowModal(true);
      });
  }, []);

  const handleCloseModal = () => setShowModal(false);

  return (
    <>
      <div className="video-container">
        <video ref={myVideoRef} autoPlay muted />
        <div id="peer-videos" />
      </div>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>Could not access camera and microphone.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Conference;
