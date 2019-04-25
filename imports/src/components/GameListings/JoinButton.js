import React from "react";

const JoinButton = ({ state, handleJoin }) => (
  <div className="game-posting-controls">
    <button
      className="btn btn-success margin"
      onClick={() => handleJoin(state._id)}
    >
      {state.users.filter(u => u.userId === Meteor.userId()).length > 0
        ? "Join again"
        : state.users.length < 2
        ? "Join"
        : "Spectate"}
    </button>
    <style jsx>{`
      .game-posting-controls {
        margin: 0 4%;
        align-self: center;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }
    `}</style>
  </div>
);
export default JoinButton;
