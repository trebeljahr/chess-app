import React from "react";

const JoinButton = ({ state, handleJoin }) => (
  <div className="game-posting-controls">
    {state.users.length < 2 ||
    state.users.filter(u => u.userId === Meteor.userId()).length > 0 ? (
      <button className="btn btn-success" onClick={() => handleJoin(state._id)}>
        {state.users.filter(u => u.userId === Meteor.userId()).length > 0
          ? "Join again"
          : "Join"}
      </button>
    ) : (
      <div className="btn btn-success">Full</div>
    )}

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
