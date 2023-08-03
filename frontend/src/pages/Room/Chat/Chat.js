import axios from "axios";
import React, {useState, useEffect, useRef, useCallback} from "react";
import './chat.css'
import Accordion from "../../../components/accordion/accordion";
import sendImg from '../../../assets/icons/send.svg'
import microUser from '../../../assets/icons/microUserAction.svg'
import cameraUser from '../../../assets/icons/cameraUserAction.svg'
import dotes from '../../../assets/icons/dotes.svg'
import back from '../../../assets/icons/back.svg'
import hand from '../../../assets/icons/hand-msg.svg'
import dino0 from '../../../assets/dinosaur/dino0.png'
import dino1 from '../../../assets/dinosaur/dino1.png'
import dino2 from '../../../assets/dinosaur/dino2.png'
import dino3 from '../../../assets/dinosaur/dino3.png'
import dino4 from '../../../assets/dinosaur/dino4.png'
import dino5 from '../../../assets/dinosaur/dino5.png'
import dino6 from '../../../assets/dinosaur/dino6.png'
import dino7 from '../../../assets/dinosaur/dino7.png'
import dino8 from '../../../assets/dinosaur/dino8.png'
import dino9 from '../../../assets/dinosaur/dino9.png'


const Chat = ({isVisible=false, 
  onClose, 
  isChat, 
  isMembers, 
  users,
  allMicrophoneMute,
  allCameraMute,
  userCameraMute,
  microphoneMute,
  userKick,
  sendMessage,
  messages,
  user,
  pcs
}) => {
    const keydownHandler = ({ key }) => {
        switch (key) {
          case 'Escape':
            onClose();
            break;
          default:
        }
      };
    
    let [message,setMessage]=useState('')
    let [msg,setMsg]=useState([])
    let [isMess,setIsMsg]=useState(false)
    let [indOfMemb,setIndOfMemb]=useState()
    let [isOptionsMember,setoptionsMembr]=useState(false)

  const sendUserMessage=()=>{
    if(message.trim().length>0){
      console.log(message)
      sendMessage(user.data.id,user.data.group,message)
    }
  }
  useEffect(() => {
    console.log('meessss',messages)
    if(messages.name!==undefined){
    msg.push(messages)
    setMsg(msg)
  }
  setIsMsg(!isMess)
    console.log(msg)
    console.log(user)
  },[messages])
  // useEffect(() => {
  // },[msg])
      useEffect(() => {
        console.log("PCSPSCPSC",pcs)
        console.log('meessss',messages)
        console.log('gggggg',users)
        console.log('gggggg',user)
        document.addEventListener('keydown', keydownHandler);
        return () => document.removeEventListener('keydown', keydownHandler);
      },[]);
      useEffect(()=>{
        console.log('uuuuuuussseeerrrrr',user.data)
        console.log('uur',users)
        console.log("PCSPSCPSC",pcs)
        users&&users[0]&&console.log('uurWWWWWW',users[0].stream.getTracks())
      },[users])
    return !isVisible ? null : (
       <div className="chat modal">
        <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            {isMembers&&
            <div>
              <div>
                <div className="chat-title">Участники ({users.length+1})</div>
                <div onClick={()=>{console.log(pcs)}}>pcs</div>
                    {/* {users.length==0?<span>никого нет</span>: */}
                    <div>
                      <div>
                        <div className="member-user">
                  <div className="dino-img">
                        <img src={dino1} alt='user'/>
                        </div>
                          {user.data.name} (Вы)</div>
                        {/* <div onClick={()=>{
                          const audioTracks = item.stream.getAudioTracks()
                          audioTracks.forEach((track) => {
                               console.log(track.muted)
                          })
                        }}>exit</div> */}
                      </div>
                      {users.map((item,index)=>
                      <div className="member" key={index}>
                        <div className="memb-panel">
                        <div className="dino-img">
                        <img src={dino2} alt='user'/>
                        </div>
                        <div>{item.name}</div>
                        </div>
                        {user.data.role=='T'&&
                        <div>
                        <img src={microUser}alt="micro"/>
                        <img src={cameraUser}alt="camera"/>
                        <img src={dotes} onClick={()=>{
                          setIndOfMemb(index)
                          setoptionsMembr(!isOptionsMember)}} alt="options"/>
                        {isOptionsMember&& indOfMemb===index&&
                        <div className={isOptionsMember?'option-members':'none-option-members'}>
                          <div onClick={()=>{microphoneMute(item.id)}} >Выкл. звук участнику</div>
                          <div onClick={()=>{userCameraMute(item.id)}} >Выкл. видео участнику</div>
                          <div onClick={()=>{userKick(item.id)}}>Удалить участника</div>
                        </div>
                         } 
                        </div>}
                        {/* <div onClick={()=>{
                          const audioTracks = item.stream.getAudioTracks()
                          audioTracks.forEach((track) => {
                               console.log(track.muted)
                          })
                        }}>exit</div> */}
                      </div>)}
                      {user.data.role==='T'&&
                    <div className="admin-member">
                      <button className="btn-admin-member" onClick={allCameraMute}>Выкл. камеру для всех</button>
                      <button className="btn-admin-member" onClick={allMicrophoneMute}>Выкл. звук для всех</button>
                    </div>}
                    </div>
                    
                </div>
                </div>}
            {isChat&&
            <div>
              <div className="chat-title chat"><img onClick={onClose} src={back} alt="back"/>Чат конференции</div>
              <div  className="chat-msg">
                {msg.map((item,index)=>
                <div className="message" key={index}>
                  <div className="dino-img">
                          <img src={dino1} alt='user'/>
                        </div>
                        <div className="msg-panel">
                          <div className="title-msg">
                            {item.name==user.data.name+user.data.surname?
                            <div>Вы</div>
                            :
                            <div>{item.name}</div>
                            }
                            <div>{item.time}</div>
                          </div>
                          <div className={item.name==user.data.name+user.data.surname?'user-msg':'msg-text'}>
                            {item.msg=='hand'?
                            <img src={hand} alt="hand"/>
                            :
                            <>
                            {item.msg}
                            </>
                            }
                          </div>
                        </div>
                </div>)}
              </div>
              <div className="chat-inp-panel">
                    <textarea className="chat-inp" onChange={e=>setMessage(e.target.value)} type="text" placeholder="Введите сообщение..."/>
                    <img src={sendImg} onClick={sendUserMessage} alt="send"/>
                </div>
                </div>}
        </div>
       </div>
   );
}

export default Chat;