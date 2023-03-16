// Импортирование необходимых модулей
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Создание компонента приложения
function Chat() {
  const [peerConnections, setPeerConnections] = useState([]); // Список установленных соединений с другими пользователями
  const [socket, setSocket] = useState(null); // WebSocket для обмена сообщениями с сервером
  const [roomId, setRoomId] = useState(''); // Идентификатор комнаты, в которой находится пользователь
  const localVideoRef = useRef(null); // Ссылка на локальный видеоэлемент
  const remoteVideosRef = useRef([]); // Ссылки на удаленные видеоэлементы
  
  // Установка соединения с сервером WebSocket
  useEffect(() => {
    const newSocket = io(`wss://rims.by/ws/video_chat/${roomId}/`);
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);
  const newRemoteVideoRef = useRef(null);
  
  // Установка локального потока медиа
  useEffect(() => {
    const getLocalMediaStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      
       // Создание RTCPeerConnection и добавление локального потока медиа
  const peerConnection = new RTCPeerConnection();
  peerConnection.addStream(stream);
  
  // Обработка события icecandidate и отправка кандидата на сервер
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', { roomId, candidate: event.candidate });
    }
  };
  
  // Обработка события addstream и добавление удаленного потока медиа
  peerConnection.onaddstream = (event) => {
    const remoteVideoRef = remoteVideosRef.current.find(ref => ref.id === event.stream.id);
    if (remoteVideoRef) {
      remoteVideoRef.srcObject = event.stream;
    } else {
      remoteVideosRef.current = [...remoteVideosRef.current, newRemoteVideoRef];
      setPeerConnections(prevState => [...prevState, { id: event.stream.id, peerConnection }]);
    }
  };
  
  // Отправка запроса на создание комнаты и получение идентификатора комнаты
  socket.emit('createRoom', (roomId) => {
    setRoomId(roomId);
  });
};

getLocalMediaStream();
}, []);

// Обработка события приема кандидата и добавление его в соответствующий RTCPeerConnection
useEffect(() => {
if (socket) {
socket.on('candidate', ({ senderId, candidate }) => {
const senderConnection = peerConnections.find(connection => connection.id === senderId).peerConnection;
senderConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
}
}, [socket, peerConnections]);

// Обработка события подключения нового пользователя к комнате
useEffect(() => {
if (socket) {
socket.on('userConnected', ({ userId }) => {
// Создание нового RTCPeerConnection и отправка кандидатов
const newPeerConnection = new RTCPeerConnection();
peerConnections.forEach(({ peerConnection }) => {
newPeerConnection.addIceCandidate(new RTCIceCandidate(peerConnection.localDescription));
peerConnection.addIceCandidate(new RTCIceCandidate(newPeerConnection.localDescription));
peerConnection.createOffer()
.then((description) => {
peerConnection.setLocalDescription(description);
newPeerConnection.setRemoteDescription(description);
newPeerConnection.createAnswer()
.then((description) => {
newPeerConnection.setLocalDescription(description);
peerConnection.setRemoteDescription(description);
});
});
});
  // Добавление нового видеоэлемента для отображения удаленного потока медиа
  remoteVideosRef.current = [...remoteVideosRef.current, newRemoteVideoRef];
  setPeerConnections(prevState => [...prevState, { id: userId, peerConnection: newPeerConnection }]);
});
}
}, [socket, peerConnections]);

// Обработка события отключения пользователя от комнаты
useEffect(() => {
if (socket) {
socket.on('userDisconnected', ({ userId }) => {
// Удаление RTCPeerConnection и связанного видеоэлемента
const removedConnection = peerConnections.find(connection => connection.id === userId);
// removedConnection.peerConnection.close();
// setPeerConnections(prevState => prevState.filter(connection => connection.id !== userId)

      // Удаление связанного видеоэлемента
      remoteVideosRef.current = remoteVideosRef.current.filter(ref => ref.id !== removedConnection.peerConnection.stream.id);
      setPeerConnections(prevState => prevState.filter(connection => connection.id !== userId));
    });
  }
}, [socket, peerConnections])
// Отправка сообщения через WebSocket
const sendMessage = (message) => {
  if (socket) {
  socket.emit('message', { roomId, message });
  }
  };
  
  const [messages,setMessages]=useState()
  const [message,setMessage]=useState()
  // Обработка события приема сообщения через WebSocket
  useEffect(() => {
  if (socket) {
  socket.on('message', ({ senderId, message }) => {
  const senderName = peerConnections.find(connection => connection.id === senderId)?.name || 'Unknown';
  const formattedMessage = {senderName}+':'+{message};
  setMessages(prevState => [...prevState, formattedMessage]);
  });
  }
  }, [socket, peerConnections]);
  
  return (
  <div>
  <video ref={localVideoRef} autoPlay muted />
  {remoteVideosRef.current.map((ref) => (
  <video key={ref.id} ref={ref} autoPlay />
  ))}
  <input type="text" value={message} onChange={(event) => setMessage(event.target.value)} />
  <button onClick={() => sendMessage(message)}>Send</button>
  {messages.map((message, index) => (
  <div key={index}>{message}</div>
  ))}
  </div>
  );
  };
  
  export default Chat;
