import React, {useState, useEffect, useRef, useCallback} from "react";

const Video = ({
    email,
    stream
}) => {
    // const
    const ref = useRef(null);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream;
    });
    return (
       <div>
        <video ref={ref} autoPlay muted />
       </div>
   );
}

export default Video;