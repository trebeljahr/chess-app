import React from "react";
const Title = ({ name }) => (
  <div>
    <h1 id="title">
      Game:
      {name.length > 10
        ? " " + name.slice(0, 10) + "..."
        : " " + name.slice(0, name.length - 1)}
    </h1>
    <style jsx>{`
      div {
        word-wrap: break-word;
        text-align: center;
        grid-area: f;
      }
      #title {
        margin: 0;
      }
    `}</style>
  </div>
);
export default Title;
