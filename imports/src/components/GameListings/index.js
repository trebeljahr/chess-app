import React from "react";
import JoinButton from "./JoinButton.js";
import GameCreationTime from "./GameCreationTime.js";
const GameListings = ({ games, handleJoin, handleDelete, archive }) => {
  return (
    <div className="gpc">
      {games.map(state => {
        return (
          <div
            key={state._id}
            className={
              "game-posting " +
              (!archive ||
              !state.archived ||
              state.users.filter(user => user.userId === Meteor.userId())
                .length === 0
                ? "hidden"
                : "")
            }
          >
            <h3 className="game-posting-title">{state.name}</h3>
            <GameCreationTime
              timestamp={state.timestamp}
              user={state.users[0]}
            />
            <JoinButton
              handleDelete={handleDelete}
              handleJoin={handleJoin}
              state={state}
              archive={archive}
            />
          </div>
        );
      })}
      <style jsx>{`
        .hidden {
          display: none;
        }
        .gpc {
          position: relative;
          width: 100%;
          margin: 0;
          padding: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-auto-columns: min-content min-content min-content;
          grid-auto-rows: max-content;
        }
        .game-posting {
          display: flex;
          padding: 5px;
          flex-direction: column;
          text-align: center;
          justify-content: center;
          align-items: center;
          background: #ccd0d4;
        }
        .game-posting-title {
          max-width: 25vw;
          margin-left: 2%;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: bold;
        }
        @media only screen and (min-width: 801px) {
          .gpc div:nth-child(odd) {
            background: white;
          }
        }
        @media only screen and (max-width: 800px) {
          .game-posting-title {
            max-width: 40vw;
          }
          .gpc {
            grid-template-columns: 1fr 1fr;
            grid-auto-columns: min-content min-content;
          }
          .gpc div:nth-child(4n-1) {
            background: white;
          }
          .gpc div:nth-child(4n-2) {
            background: white;
          }
        }
        @media only screen and (max-width: 600px) {
          .game-posting-title {
            max-width: 80vw;
          }
          .gpc {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0;
            padding: 0;
          }
          .gpc div:nth-child(odd) {
            background: white;
          }
          .gpc div:nth-child(4n-2) {
            background: #ccd0d4;
          }
        }
      `}</style>
    </div>
  );
};
export default GameListings;
