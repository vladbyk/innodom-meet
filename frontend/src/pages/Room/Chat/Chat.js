import axios from "axios";
import React, {useState, useEffect, useRef, useCallback} from "react";
import './chat.css'
import Accordion from "../../../components/accordion/accordion";
import sendImg from '../../../assets/icons/send.svg'

const Chat = ({isVisible=false, onClose, isChat, isMembers, users}) => {
    const keydownHandler = ({ key }) => {
        switch (key) {
          case 'Escape':
            onClose();
            break;
          default:
        }
      };
    
      useEffect(() => {
        console.log(users.length)
        document.addEventListener('keydown', keydownHandler);
        return () => document.removeEventListener('keydown', keydownHandler);
      });
    return !isVisible ? null : (
       <div className="chat modal">
        <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            {isMembers&&
            <div>
                <Accordion
                title={`Участники (${users.length})`}
                content={<div>
                    {users.length==0&&<span>никого нет</span>}
                </div>}
                />
                </div>}
            {isChat&&
            <div>
                <Accordion
                title="Чат конференции"
                content={<div>
                    <input type="text" placeholder="Введите здесь сообщение..."/>
                    <img src={sendImg} alt="send"/>
                </div>}
                />
                </div>}
        </div>
       </div>
   );
}

export default Chat;