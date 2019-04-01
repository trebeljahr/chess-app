import React from "react";
import "./Dashboard.css";
import { invertColor } from "../../helpers/invertColor.js";
import UndoButton from "../UndoButton";
import ChatContainer from "../Chat";

const Dashboard = game => {
  return (
    <div className="Dashboard">
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
      <div className="controlElements">
        <p>
          {game.checkmate
            ? invertColor(game.turn) + " wins!"
            : game.remis
            ? "It's a draw!"
            : "It's " + game.turn + "'s turn"}
        </p>
        <a className="btn btn-success" href="/">
          Home
        </a>
        <UndoButton
          color={game.color}
          proposeUndo={game.proposeUndo}
          revertUndoProposal={game.revertUndoProposal}
          handleUndo={game.handleUndo}
          moveHistory={game.moveHistory}
          offerTakeback={game.offerTakeback}
        />
        <ChatContainer _id={game._id} messages={game.messages} />
      </div>
    </div>
  );
};

export default Dashboard;
