import React from "react";
const Title = ({ name }) => (
  <div>
    <h4 className="GameTitle">Game: {name}</h4>
    <style jsx>{`
      div {
        width: 100%;
        text-align: center;
        margin-top: 10px;
      }
    `}</style>
  </div>
);
export default Title;
