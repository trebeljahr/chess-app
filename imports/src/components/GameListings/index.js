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
              (!state.archived &&
              !archive &&
              !state.users.filter(user => user.userId === Meteor.userId())
                .length === 1
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
          text-align: center;
          justify-items: center;
        }
        .game-posting {
          display: flex;
          padding: 5px;
          flex-direction: column;
          text-align: center;
          justify-content: center;
          align-items: center;
        }
        .game-posting-title {
          max-width: 25vw;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: bold;
        }

        @media only screen and (max-width: 800px) {
          .game-posting-title {
            max-width: 40vw;
          }
          .gpc {
            grid-template-columns: 1fr 1fr;
            grid-auto-columns: min-content min-content;
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
        }
      `}</style>
    </div>
  );
};
export default GameListings;
