import React from "react";
import JoinButton from "./JoinButton.js";
const GameListings = ({ games, handleJoin, handleDelete }) => (
  <div className="gpc">
    {games.map(state => (
      <div
        key={state._id}
        className={"game-posting " + (state.deleteGame ? "hidden" : "")}
      >
        <h3 className="game-posting-title">{state.name}</h3>
        <JoinButton
          handleDelete={handleDelete}
          handleJoin={handleJoin}
          state={state}
        />
      </div>
    ))}
    <style jsx>{`
      .hidden {
        display: none;
      }
      .gpc {
        position: relative;
        width: 100%;
        height: 90vh;
        margin: 0;
        padding: 0;
        padding-top: 5px;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: scroll;
        scrollbar-color: #286090 #fff;
      }
      .gpc::-webkit-scrollbar {
        width: 15px;
      }
      .gpc::-webkit-scrollbar-track-piece {
        background: white;
      }
      .gpc::-webkit-scrollbar-thumb:vertical {
        background: #286090;
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
