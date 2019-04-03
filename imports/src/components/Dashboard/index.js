import React from "react";
import "./Dashboard.css";
import { invertColor } from "../../helpers/invertColor.js";
import UndoButton from "../UndoButton";
import ChatContainer from "../Chat";

const Dashboard = game => {
  return (
    <div className="Dashboard">
      <div>
        <div>
          <div className="textContainer">
            {game.color === "spectating" ? (
              <p>
                {game.checkmate
                  ? invertColor(game.turn) + " wins!"
                  : game.remis
                  ? "It's a draw!"
                  : "It's " + game.turn + "'s turn"}
              </p>
            ) : (
              <p>
                {game.checkmate
                  ? invertColor(game.turn) === game.color
                    ? "You win"
                    : "Your opponent wins!"
                  : game.remis
                  ? "It's a draw!"
                  : "It's " +
                    (game.turn === game.color ? "your" : "your opponents") +
                    " turn"}
              </p>
            )}
          </div>
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
        </div>

        <div className="controlElements">
          <div>
            <a className="btn btn-success" href="/">
              <i className="fas fa-home" />
            </a>
          </div>
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
    </div>
  );
};

export default Dashboard;
