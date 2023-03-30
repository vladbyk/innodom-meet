import axios from "axios";
import React, {useState, useEffect, useRef, useCallback} from "react";

const Lobby = ({
    email,
    handleUserEmailChange,
    ConnectionRoom
}) => {
    const [us,setus]=useState([{name:'fff',f:'vvv'}])
    useEffect(()=>{
        setus(oldUsers => [
            ...oldUsers,
            {
                name: 'ddd',
                f:'gg',
            },
        ])
        console.log(us)
    },[])
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