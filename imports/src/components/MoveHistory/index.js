import React from "react";
const MoveHistory = ({ moveHistory }) => (
  <div>
    {moveHistory.map((move, index) => (
      <span
        key={index}
        className={
          move.figure.color + " outer fas fa-chess-" + move.figure.type
        }
      >
        {"" +
          String.fromCharCode(move.oldPos.col + 65) +
          (move.oldPos.row + 1) +
          "↠" +
          String.fromCharCode(move.newPos.col + 65) +
          (move.newPos.row + 1)}
        {move.secondFigure === "noFigure" ? (
          ""
        ) : (
          <span
            className={
              move.secondFigure.color +
              " fas fa-chess-" +
              move.secondFigure.type
            }
          />
        )}
      </span>
    ))}
    <style jsx>{`
      div {
        background: grey;
        grid-area: a;
        min-height: 0;
        align-self: stretch;
        overflow-y: scroll;
        scrollbar-color: #286090 #fff;
      }
      div::-webkit-scrollbar {
        width: 0;
      }

      .outer {
        margin: 10px;
      }
      .white {
        color: white;
      }
      .black {
        color: black;
      }
      @media only screen and (max-aspect-ratio: 7/5) {
        div {
          display: none;
        }
      }
    `}</style>
  </div>
);

export default MoveHistory;
