import React from "react";

const JoinButton = ({ state, handleJoin, handleDelete, archive }) => (
  <div className="game-posting-controls">
    {state.users.length < 2 ||
    state.users.filter(u => u.userId === Meteor.userId()).length > 0 ? (
      <div>
        <button
          className="btn btn-success"
          onClick={() => handleJoin(state._id)}
        >
          {state.users.filter(u => u.userId === Meteor.userId()).length > 0
            ? !archive ||
              !state.archived ||
              state.users.filter(user => user.userId === Meteor.userId())
                .length === 0
              ? "Join again"
              : "Analyze"
            : "Join"}
        </button>
        {state.users.length === 1 &&
        Meteor.userId() === state.users[0].userId ? (
          <button
            className="btn btn-danger"
            onClick={() => handleDelete(state._id)}
          >
            <i className="fas fa-trash" />{" "}
          </button>
        ) : null}
      </div>
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
      div {
        display: flex;
        flex-direction: row;
      }
      button {
        margin: 5px;
      }
    `}</style>
  </div>
);
export default JoinButton;
