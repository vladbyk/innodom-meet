import React, {useState, useEffect, useRef, useCallback} from "react";

const Video = ({
    stream,
    user
}) => {
    // const
    const ref = useRef();
    // const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        ref.current.srcObject = stream;
        console.log('video',ref)
        console.log('video',user)
    });
    return (
       <div>
        {/* <div>{user.id}</div> */}
        <video ref={ref} autoPlay muted={false}/>
        {/* <video ref={stream} autoPlay muted /> */}
       </div>
   );
}

export default Video;