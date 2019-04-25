import React from "react";
import UndoButton from "../UndoButton";
import ChatContainer from "../Chat";
import TextContainer from "../TextContainer";
import MoveHistory from "../MoveHistory";
import HomeButton from "../HomeButton";
import AbandonGameButton from "../AbandonGameButton";

const Dashboard = game => {
  return (
    <div className="Dashboard">
      <MoveHistory moveHistory={game.moveHistory} />
      <TextContainer
        color={game.color}
        checkmate={game.checkmate}
        turn={game.turn}
        remis={game.remis}
      />
      <HomeButton />
      <UndoButton
        color={game.color}
        proposeUndo={game.proposeUndo}
        revertUndoProposal={game.revertUndoProposal}
        handleUndo={game.handleUndo}
        moveHistory={game.moveHistory}
        offerTakeback={game.offerTakeback}
      />
      {game.checkmate || game.remis ? (
        <AbandonGameButton
          deleteGame={game.deleteGame}
          color={game.color}
          _id={game._id}
        />
      ) : null}
      <ChatContainer _id={game._id} messages={game.messages} />
      <style jsx>
        {`
          .moveHistoryDisplay {
            display: grid;
            grid-template-columns: 1fr 1fr;
            overflow: scroll;
            background: grey;
          }
          .undoProposal {
            display: flex;
            flex-direction: column;
            justify-content: space-around;
          }
          .hourglass {
            color: #fff;
            background-color: #f0ad4e;
            border-color: #eea236;
            display: inline-block;
            padding: 6px 12px;
            margin-bottom: 0;
            font-size: 14px;
            font-weight: 400;
            line-height: 1.42857143;
            text-align: center;
            white-space: nowrap;
            vertical-align: middle;
            border-radius: 4px;
          }
          .textContainer {
            margin-top: 2%;
            display: flex;
            justify-content: space-around;
          }
          .Dashboard {
            padding-top: 3%;
            width: 90vmin;
            height: 25vh;
            margin: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
          .controlElements {
            display: flex;
            flex-direction: column;
            padding-left: 2em;
          }
          @media only screen and (orientation: portrait) {
            .Dashboard {
              padding-top: 1%;
              grid-template-columns: 1fr;
              grid-template-rows: 2fr 3fr;
            }
            .controlElements {
              display: flex;
              flex-direction: row;
              padding-left: 0em;
              padding-top: 1%;
              justify-content: space-around;
            }
          }
          @media only screen and (orientation: landscape) {
            .Dashboard {
              padding: 0%;
              height: 90vmin;
              display: grid;
              flex-grow: 2;
              grid-template-columns: auto auto;
              grid-template-rows: 100%;
            }
            .controlElements {
              flex-direction: column;
              flex-wrap: wrap;
              justify-content: space-around;
            }
          }

          .moveHistoryDisplay > span {
            font-size: 0.8em;
          }
          .moveHistoryDisplay > span > span {
            font-size: 1em;
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;
