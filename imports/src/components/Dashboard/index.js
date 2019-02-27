import React from "react";
import "./Dashboard.css";
import { invertColor } from "../../helpers/invertColor.js";
import ResetBoard from "../ResetBoard";
import UndoButton from "../UndoButton";
const Dashboard = props => {
  return (
    <div className="flex-container grey">
      {props.moveHistory.map((move, index) => {
        return (
          <p
            key={index}
            className={move.figure.color + " fas fa-chess-" + move.figure.type}
          >
            {"" +
              String.fromCharCode(move.oldPos.col + 65) +
              move.oldPos.row +
              "->" +
              String.fromCharCode(move.newPos.col + 65) +
              move.newPos.row +
              move.secondFigure[0]}
          </p>
        );
      })}
      <p className="dashboard-text">
        {props.checkmate
          ? invertColor(props.turn) + " wins!"
          : props.remis
          ? "It's a draw!"
          : "It's " + props.turn + "'s turn"}
      </p>
      <ResetBoard resetBoard={props.resetBoard} />
      <UndoButton
        handleUndo={props.handleUndo}
        moveHistory={props.moveHistory}
      />
    </div>
  );
};

export default Dashboard;
