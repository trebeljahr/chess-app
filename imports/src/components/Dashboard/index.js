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
      {game.checkmate || game.remis ? (
        <AbandonGameButton
          deleteGame={game.deleteGame}
          color={game.color}
          _id={game._id}
        />
      ) : (
        <UndoButton
          color={game.color}
          proposeUndo={game.proposeUndo}
          revertUndoProposal={game.revertUndoProposal}
          handleUndo={game.handleUndo}
          moveHistory={game.moveHistory}
          deleteGame={game.deleteGame}
          offerTakeback={game.offerTakeback}
        />
      )}
      <ChatContainer _id={game._id} messages={game.messages} />
      <style jsx>{`
        .Dashboard {
          display: grid;
          grid-template-areas:
            "a a a"
            "b b b"
            "c d e";
          grid-auto-rows: minmax(0, auto);
        }
        @media (orientation: landscape) {
          .Dashboard {
            display: grid;
            grid-template-areas: "a a a" "b b b" "c d e";
            grid-template-rows: 4fr 1fr 1fr;
            grid-template-columns: 1fr 2fr 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
