import React from "react";
import "./Dashboard.css";
import { invertColor } from "../../helpers/invertColor.js";
import ResetBoard from "../ResetBoard";
import UndoButton from "../UndoButton";
import ChatContainer from "../Chat";

const Dashboard = game => {
  return (
    <div>
      <div className="moveHistoryDisplay">
        {game.moveHistory.map((move, index) => {
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
        {game.checkmate
          ? invertColor(game.turn) + " wins!"
          : game.remis
          ? "It's a draw!"
          : "It's " + game.turn + "'s turn"}
      </p>
      <div className="controlElements">
        <a className="btn btn-success" href="/">
          Home
        </a>
        <ResetBoard resetBoard={game.resetBoard} />
        <UndoButton
          handleUndo={game.handleUndo}
          moveHistory={game.moveHistory}
        />
        <ChatContainer _id={game._id} messages={game.messages} />
      </div>
    </div>
  );
};

export default Dashboard;
