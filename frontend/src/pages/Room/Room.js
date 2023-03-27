import axios from "axios";
import React, {useState, useEffect, useRef, useCallback} from "react";

const Room = (data) => {
    const connectRoom = () => {
        console.log('sok',data.data)
        const socket = new WebSocket(`wss://rims.by/ws/room/${data.data.group}/`);
        socket.onopen = () => {
            console.log("WebSocket connection established");
            // socket.send(JSON.stringify({type: "join_room", roomId}));
        };
        // socket.onmessage = (event) => {
        //     const message = JSON.parse(event.data);
        // };
        // return () => {
        //     socket.close();
        // };
    };
    useEffect(()=>{
        connectRoom()
    },[])
    return (
       <div>
           <h1>room</h1>
       </div>
   );
}

export default Room;