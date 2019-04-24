import React from "react";
import "./App.css";
import Board from "./components/Board";
import Dashboard from "./components/Dashboard";
import PawnChangeInterface from "./components/PawnChangeInterface";
import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";
import Title from "./components/Title";

class ChessApp extends React.Component {
  constructor(props) {
    super(props);
  }

  handleFirstClick = field => {
    if (this.props.game) {
      Meteor.call("states.handleFirstClick", {
        _id: this.props.game._id,
        field,
        userId: Meteor.userId()
      });
    }
  };
  handleSecondClick = field => {
    if (this.props.game) {
      Meteor.call("states.handleSecondClick", {
        _id: this.props.game._id,
        field,
        userId: Meteor.userId()
      });
    }
  };
  handleUndo = () => {
    if (this.props.game) {
      Meteor.call("states.handleUndo", {
        _id: this.props.game._id,
        userId: Meteor.userId()
      });
    }
  };
  proposeUndo = () => {
    if (this.props.game) {
      Meteor.call("states.proposeUndo", {
        _id: this.props.game._id,
        userId: Meteor.userId()
      });
    }
  };
  revertUndoProposal = () => {
    if (this.props.game) {
      Meteor.call("states.revertUndoProposal", {
        _id: this.props.id,
        userId: Meteor.userId()
      });
    }
  };

  continueTurn = figure => {
    if (this.props.game) {
      Meteor.call("states.handlePawnChange", {
        _id: this.props.game._id,
        figure,
        userId: Meteor.userId()
      });
    }
  };
  render() {
    if (this.props.game) {
      let game = this.props.game;
      let color = game.users.find(user => user.userId === Meteor.userId())
        .color;
      return (
        <div className="AppContainer">
          <Title name={game.name} />
          <Board
            board={game.board}
            turnAround={color === "black" ? true : false}
            handleClick={
              game.movePart === 0
                ? this.handleFirstClick
                : this.handleSecondClick
            }
          />
          <PawnChangeInterface
            baseLinePawn={game.baseLinePawn}
            turn={game.turn}
            color={color}
            continueTurn={this.continueTurn}
          />
          <Dashboard
            _id={game._id}
            checkmate={game.checkmate}
            remis={game.remis}
            turn={game.turn}
            color={color}
            revertUndoProposal={this.revertUndoProposal}
            proposeUndo={this.proposeUndo}
            handleUndo={this.handleUndo}
            offerTakeback={game.offerTakeback}
            moveHistory={game.moveHistory}
          />
          <style jsx>{`
            body {
              font-size: 1.6em;
            }
            .grey {
              display: flex;
              justify-content: space-around;
              margin-top: 3%;
              background-color: grey;
            }
            @media only screen and (orientation: portrait) {
              .AppContainer {
                padding-top: 10%;
                display: block;
                text-align: center;
                height: 100vh;
                width: 100vw;
              }
              .sidebar {
                width: 90vmin;
                margin: auto;
              }
            }

            @media only screen and (orientation: landscape) {
              .AppContainer {
                padding-top: 4.1%;
                display: flex;
                height: 100vh;
                width: 100vw;
              }
              .GameTitle {
                visibility: hidden;
              }
              .sidebar {
                height: 90vmin;
                margin: auto;
              }
            }
            .turnToBlackPlayer {
              transform: translateZ(0px) rotate(180deg);
            }
            .row {
              flex-direction: row;
            }
            .column {
              flex-direction: column;
            }
            .board {
              border: none;
              display: grid;
              margin: auto;
              width: 90vmin;
              height: 90vmin;
              grid-template-rows: repeat(8, 11.25vmin);
              grid-template-columns: repeat(8, 11.25vmin);
            }
            .board div {
              font-size: 3vmin;
              text-align: center;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .selected {
              background: #5f939b !important;
            }
            .check {
              background: #f55d3e !important;
            }
            .grey {
              background-color: darkgrey;
            }
            .valid {
              width: 90%;
              height: 90%;
              background: #28c958d2;
              border-radius: 100%;
            }
            .rochade {
              background: blue !important;
            }
            span {
              font-size: 8vmin;
            }
            .black-tile {
              background: #a15e49;
              border: none;
              z-index: 2;
            }
            .white-tile {
              background: #ca895f;
              border: none;
              z-index: 2;
            }
            .white {
              color: white;
            }
            .black {
              color: black;
            }
            .figures {
              width: 80%;
              height: 80%;
              line-height: 3em;
            }
          `}</style>
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}
const ChessAppContainer = withTracker(props => {
  const _id = props.match.params.id;
  const handle = Meteor.subscribe("states");
  const game = States.find({ _id }).fetch()[0];
  return {
    id: _id,
    game
  };
})(ChessApp);
export default ChessAppContainer;
