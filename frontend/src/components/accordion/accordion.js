import React, { useEffect, useRef, useState } from "react";

import "./accordion.css";

import arrDown from '../../assets/icons/arr-down.svg'

function Accordion(props) {
  const [active, setActive] = useState(false);
  const content = useRef(null);
  const [height, setHeight] = useState("0px");

  useEffect(() => {
    console.log("Height for ", props.title, ": ", height);
  }, [height]);

  function toggleAccordion() {
    setActive(!active);
    setHeight(active ? "0px" : `${content.current.scrollHeight}px`);
  }

  return (
    <div className="accordion__section">
      <div
        className={`accordion ${active ? "active" : ""}`}
        onClick={toggleAccordion}
      >
        <span style={{ marginLeft: "20px" }}><img src={arrDown} alt="open"/></span>
        <p className="accordion__title">{props.title}</p>
      </div>
      <div
        ref={content}
        style={{ maxHeight: `${height}` }}
        className="accordion__content"
      >
        {props.content}
        {/* <div
          className="accordion__text"
          dangerouslySetInnerHTML={{ __html: props.content }}
        /> */}
      </div>
    </div>
  );
}

export default Accordion;
