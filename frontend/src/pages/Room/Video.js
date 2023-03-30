import React, {useState, useEffect, useRef, useCallback} from "react";

const Video = ({
    email,
    stream,
    user
}) => {
    // const
    const ref = useRef();
    // const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream;
        console.log(email)
        console.log(ref)
        console.log(user)
    });
    return (
       <div>
        <video ref={ref} autoPlay muted />
       </div>
   );
}

export default Video;