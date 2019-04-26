import React from "react";
const NewGameForm = ({ extend, handleExtend, createNewGame }) =>
  extend ? (
    <div className="fullScreen">
      <div className="fullScreen opaque" onClick={handleExtend} />
      <div className="formContainer">
        <h2>Create a new game</h2>
        <form onSubmit={createNewGame} className="createGameForm">
          <input
            className="formInput"
            type="text"
            name="name"
            placeholder="Name"
          />
          <h4>Play as</h4>
          <label htmlFor="white">White</label>
          <input
            id="white"
            type="radio"
            name="color"
            value="white"
            defaultChecked
          />
          <label htmlFor="black">Black</label>
          <input id="black" type="radio" name="color" value="black" />
          <label htmlFor="random">Random</label>
          <input id="random" type="radio" name="color" value="random" />
          <input type="submit" value="Create Game!" />
        </form>
      </div>
      <style jsx>{`
        .createGameForm {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .fullScreen {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          top: 0;
          left: 0;
        }
        .opaque {
          background: grey;
          opacity: 0.5;
        }
        .formContainer {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5vmin;
          background: white;
          z-index: 2;
          position: relative;
        }
        .formInput {
          text-align: center;
        }
        .submitButtonsContainer {
          width: 100%;
          margin: 2%;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }
      `}</style>
    </div>
  ) : (
    <div className="absolute">
      <button className="btn btn-primary" onClick={handleExtend}>
        +
      </button>
      <style jsx>{`
        .absolute {
          position: absolute;
          top: 10vh;
          width: 100%;
          z-index: 200;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }
        button {
          position: absolute;
          top: 0;
          z-index: 1;
          pointer-events: all;
        }
      `}</style>
    </div>
  );
export default NewGameForm;