import React from "react";
import UndoButton from "../UndoButton";
import ChatContainer from "../Chat";
import TextContainer from "../TextContainer";
import MoveHistory from "../MoveHistory";
import HomeButton from "../HomeButton";
import AbandonGameButton from "../AbandonGameButton";
import Title from "../Title";
import WhoPlays from "../WhoPlays";

const Dashboard = game => {
  return (
    <div
      className={"Dashboard " + (game.checkmate || game.remis ? "leave" : "")}
    >
      <Title name={game.name} />
      <WhoPlays users={game.users} />
      <MoveHistory moveHistory={game.moveHistory} />
      <TextContainer
        color={game.color}
        checkmate={game.checkmate}
        turn={game.turn}
        remis={game.remis}
      />
      {game.checkmate || game.remis ? null : <HomeButton />}
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
          padding: 0 5vmin;
          margin: 0;
          margin-bottom: 10vmin;
          width: 100vmin;
          height: 100%;
          display: grid;
          grid-template-areas:
            "b b b"
            "c d e"
            "f f f"
            "g g g"
            "a a a";
          grid-auto-rows: min-content;
          grid-row-gap: 10px;
        }
        .leave {
          grid-template-areas:
            "d d e"
            "b b b"
            "f f f"
            "g g g"
            "a a a";
        }

        @media only screen and (min-aspect-ratio: 7/5) {
          .Dashboard {
            margin-top: 10vmin;
            width: 100%;
            max-height: 80vh;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
