import React from "react";

const XAxis = ({ turnAround }) => (
  <div className={"axis " + (turnAround ? "turnToBlackPlayer" : "")}>
    {["A", "B", "C", "D", "E", "F", "G", "H"].map(letter => (
      <div key={letter}>{letter}</div>
    ))}
    <style jsx>{`
      .axis {
        position: absolute;
        left: 5vmin;
        top: 85vmin;
        display: flex;
        justify-content: space-around;
        width: 80vmin;
      }
      .turnToBlackPlayer {
        flex-direction: row-reverse;
      }
      @media (orientation: portrait) {
        div {
          display: none;
        }
      }
    `}</style>
  </div>
);

export default XAxis;
