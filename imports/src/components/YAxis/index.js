import React from "react";

const YAxis = ({ turnAround }) => (
  <div className={"axis " + (turnAround ? "turnToBlackPlayer" : "")}>
    {["1", "2", "3", "4", "5", "6", "7", "8"].map(letter => (
      <div key={letter}>{letter}</div>
    ))}
    <style jsx>{`
      .axis {
        position: absolute;
        left: 0;
        top: 0;
        display: flex;
        flex-direction: column-reverse;
        justify-content: space-around;
        margin-top: 5vmin;
        margin-left: 2vmin;
        height: 80vmin;
      }
      .turnToBlackPlayer {
        flex-direction: column;
      }
    `}</style>
  </div>
);

export default YAxis;
