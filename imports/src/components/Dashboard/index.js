import React from "react";
import UndoButton from "../UndoButton";
import ChatContainer from "../Chat";
import TextContainer from "../TextContainer";
import MoveHistory from "../MoveHistory";
import HomeButton from "../HomeButton";

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
      <ChatContainer _id={game._id} messages={game.messages} />
    </div>
  );
};

export default Dashboard;
