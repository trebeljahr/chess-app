import React from "react";
import JoinButton from "./JoinButton.js";
const GameListings = ({ games, handleJoin }) => (
  <div className="game-postings-container">
    {games.map(state => (
      <div
        key={state._id}
        className={"game-posting " + (state.deleteGame ? "hidden" : "")}
      >
        <h3 className="game-posting-title">{state.name}</h3>
        <JoinButton handleJoin={handleJoin} state={state} />
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
    `}</style>
  </div>
);
export default GameListings;
