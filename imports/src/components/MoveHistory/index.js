import React from "react";
const MoveHistory = ({ moveHistory }) => {
  return moveHistory.map((move, index) => {
    return (
      <span
        key={index}
        className={move.figure.color + " fas fa-chess-" + move.figure.type}
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
    );
  });
};
export default MoveHistory;
