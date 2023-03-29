import React, {useState, useEffect, useRef, useCallback} from "react";

const Video = ({
    email,
    stream
}) => {
    // const
    const ref = useRef();
    // const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream;
        console.log(email)
        console.log(ref)
    });
    return (
       <div>
        <video ref={ref} autoPlay muted />
       </div>
   );
}

export default Video;