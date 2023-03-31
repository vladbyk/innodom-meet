import axios from "axios";
import React, {useState, useEffect, useRef, useCallback} from "react";

const Lobby = ({
    email,
    handleUserEmailChange,
    ConnectionRoom
}) => {
    return (
       <div>
        <label htmlFor="email">Почта:</label>
           <input
          type="email"
          id="email"
          value={email}
          onChange={handleUserEmailChange}
          required
        />
        <button onClick={ConnectionRoom}>Connect</button>
       </div>
   );
}

export default Lobby;