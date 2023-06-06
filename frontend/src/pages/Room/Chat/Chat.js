import axios from "axios";
import React, {useState, useEffect, useRef, useCallback} from "react";
import './chat.css'
import Accordion from "../../../components/accordion/accordion";
import sendImg from '../../../assets/icons/send.svg'

const Chat = ({isVisible=false, onClose, isChat, isMembers, users,allMicrophoneMute,allCameraMute}) => {
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
        console.log('gggggg',users)
        document.addEventListener('keydown', keydownHandler);
        return () => document.removeEventListener('keydown', keydownHandler);
      },[]);
      useEffect(()=>{
        console.log('uuuuuuussseeerrrrr',users)
      },[users])
    return !isVisible ? null : (
       <div className="chat modal">
        <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            {isMembers&&
            <div>
                <Accordion
                title={`Участники (${users.length+1})`}
                content={<div>
                    {users.length==0?<span>никого нет</span>:
                    <div>
                      {/* <div>
                        <div>{item.name}</div>
                        <div onClick={()=>{
                          const audioTracks = item.stream.getAudioTracks()
                          audioTracks.forEach((track) => {
                               console.log(track.muted)
                          })
                        }}>exit</div>
                      </div> */}
                      {users.map((item,index)=>
                      <div key={index}>
                        <div>{item.name}</div>
                        {/* <div onClick={()=>{
                          const audioTracks = item.stream.getAudioTracks()
                          audioTracks.forEach((track) => {
                               console.log(track.muted)
                          })
                        }}>exit</div> */}
                      </div>)}
                    <div>
                      <button onClick={allCameraMute}>Выкл. камеру для всех</button>
                      <button onClick={allMicrophoneMute}>Выкл. звук для всех</button>
                    </div>
                    </div>
                    }
                    
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