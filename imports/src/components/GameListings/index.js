import React from "react";
const GameListings = ({ games, handleJoin }) => (
  <div className="game-postings-container">
    {games.map(state => (
      <div
        key={state._id}
        className={"game-posting " + (state.deleteGame ? "hidden" : "")}
      >
        <h3 className="game-posting-title">{state.name}</h3>
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
        </div>
      </div>
    ))}
    <style jsx>{`
      .hidden {
        display: none;
      }
      .game-postings-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 10vh;
      }
      .game-posting {
        width: 80vw;
        border: 1px solid;
        margin: 4px;
        display: flex;
        flex-direction: row;
        text-align: center;
        justify-content: space-between;
        align-items: center;
      }
      .game-posting-title {
        margin-left: 2%;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
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
export default GameListings;
