import React from "react";
const Title = ({ name }) => (
  <div>
    <h1 className="GameTitle">Game: {name}</h1>
    <style jsx>{`
      div {
        width: 100%;
        text-align: center;
        margin-top: 5vmin;
      }
      h4 {
        margin: 0;
      }
    `}</style>
  </div>
);
export default Title;
