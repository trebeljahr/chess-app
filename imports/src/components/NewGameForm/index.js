import React from "react";
const NewGameForm = ({ extend, handleExtend, createNewGame }) =>
  extend ? (
    <div className="fullScreen">
      <div className="fullScreen opaque" onClick={handleExtend} />
      <div className="formContainer">
        <h2>Create a new game</h2>
        <form onSubmit={createNewGame} className="createGameForm">
          <input
            type="text"
            name="name"
            className="formInput"
            placeholder="Enter a name for your game!"
          />
          <div>
            <label htmlFor="white">
              <p>White</p>
              <input
                id="white"
                type="radio"
                name="color"
                value="white"
                defaultChecked
              />
              <span className="checkmark" />
            </label>
            <label htmlFor="black">
              <p>Black</p>
              <input id="black" type="radio" name="color" value="black" />
              <span className="checkmark" />
            </label>
            <label htmlFor="random">
              <p>Random</p>
              <input id="random" type="radio" name="color" value="random" />
              <span className="checkmark" />
            </label>
          </div>
          <input className="submit" type="submit" value="Create Game!" />
        </form>
      </div>
      <style jsx>{`
        .submit {
          margin-top: 10px;
          border: none;
          background: #465362;
          padding: 2vh 0;
          color: white;
        }
        .fullScreen {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 3;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .opaque {
          background: linear-gradient(
            111.45349766483548deg,
            rgba(2, 27, 62, 1) 5.73779698099772%,
            rgba(81, 119, 149, 1) 96.25816012540469%
          );
          opacity: 0.9;
        }
        .formContainer {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5vw;
          background: white;
          z-index: 4;
          text-align: center;
          position: relative;
        }
        p {
          margin: 0;
        }
        .createGameForm {
          margin-top: 2vh;
          min-width: 60vw;
          padding: 0 5vw;
          display: grid;
          grid-gap: 15px;
        }
        form > div {
          justify-self: stretch;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: center;
          line-height: 1em;
        }
        .formInput {
          text-align: center;
          border: none;
          background: #ccd0d4;
          padding: 5px 0;
        }
        label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding-bottom: 35px;
          cursor: pointer;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        label input {
          position: absolute;
          bottom: 0;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        .checkmark {
          position: absolute;
          bottom: 5px;
          height: 25px;
          width: 25px;
          background-color: #eee;
          border-radius: 50%;
        }
        label:hover input ~ .checkmark {
          background-color: #ccc;
        }
        label input:checked ~ .checkmark {
          background-color: #2196f3;
        }
        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }
        label input:checked ~ .checkmark:after {
          display: block;
        }
        label .checkmark:after {
          top: 9px;
          left: 9px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: white;
        }
      `}</style>
    </div>
  ) : (
    <div>
      <i className="fas fa-plus-circle fa-3x" onClick={handleExtend} />
      <style jsx>{`
        i {
          color: #246eb9;
          background: white;
          border-radius: 50%;
        }
        i:hover {
          color: #090c9b;
        }
        div {
          position: absolute;
          bottom: 3vh;
          right: 3vh;
          z-index: 1;
        }
      `}</style>
    </div>
  );
export default NewGameForm;
