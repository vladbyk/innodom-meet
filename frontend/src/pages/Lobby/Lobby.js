import axios from "axios";
import React, {useState, useEffect, useRef, useCallback} from "react";
import './lobby.css'

const Lobby = ({
    email,
    handleUserEmailChange,
    ConnectionRoom
}) => {
    return (
       <div className="lobby">
        <label htmlFor="email">Enter email:</label>
           <input
          type="email"
          id="email"
          value={email}
          onChange={handleUserEmailChange}
          required
        />
        <button className="connect-btn" onClick={ConnectionRoom}>Connect</button>
       </div>
   );
}

export default Lobby;