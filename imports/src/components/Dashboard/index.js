import React from "react";
import "./Dashboard.css";
import { invertColor } from "../../helpers/invertColor.js";
import ResetBoard from "../ResetBoard";
import UndoButton from "../UndoButton";
import Chat from "../Chat";

const Dashboard = props => {
  return (
    <div>
      <div className="moveHistoryDisplay">
        {props.moveHistory.map((move, index) => {
          return (
            <span
              key={index}
              className={
                move.figure.color + " fas fa-chess-" + move.figure.type
              }
            >
              {"" +
                String.fromCharCode(move.oldPos.col + 65) +
                move.oldPos.row +
                "↠" +
                String.fromCharCode(move.newPos.col + 65) +
                move.newPos.row}
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
        })}
      </div>
      <p className="dashboard-text">
        {props.checkmate
          ? invertColor(props.turn) + " wins!"
          : props.remis
          ? "It's a draw!"
          : "It's " + props.turn + "'s turn"}
      </p>
      <div className="controlElements">
        <a className="btn btn-success" href="/">
          Home
        </a>
        <ResetBoard resetBoard={props.resetBoard} />
        <UndoButton
          handleUndo={props.handleUndo}
          moveHistory={props.moveHistory}
        />
        <Chat />
      </div>
    </div>
  );
};

export default Dashboard;
