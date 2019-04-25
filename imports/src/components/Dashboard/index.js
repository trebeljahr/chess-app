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
      <div className="MoveHistory">
        <MoveHistory moveHistory={game.moveHistory} />
      </div>
      <div className="TextContainer">
        <TextContainer
          color={game.color}
          checkmate={game.checkmate}
          turn={game.turn}
          remis={game.remis}
        />
      </div>
      <div className="controls">
        <HomeButton className="HomeButton" />
        <UndoButton
          color={game.color}
          proposeUndo={game.proposeUndo}
          revertUndoProposal={game.revertUndoProposal}
          handleUndo={game.handleUndo}
          moveHistory={game.moveHistory}
          deleteGame={game.deleteGame}
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
      </div>
      <style jsx>{`
        .Dashboard {
          display: grid;
        }
        @media (orientation: landscape) {
          .Dashboard {
            display: flex;
            text-align: center;
            flex-direction: column;
            justify-content: center;
            margin: 10vmin 5px;
          }
          .controls {
            grid-area: c;
            display: flex;
            justify-content: space-around;
          }
        }
        @media (orientation: portrait) {
          .Dashboard {
            margin: 10vmin;
            grid-template-areas:
              "a"
              "b"
              "c";
          }
          .controls {
            display: flex;
            justify-content: space-around;
          }
          .MoveHistory,
          .TextContainer {
            display: flex;
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
