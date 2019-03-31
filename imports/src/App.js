import React from "react";
import "./App.css";
import { getDefaultState } from "./helpers/getDefaultState.js";
import { convertPos } from "./helpers/convertPos.js";
import { createFieldMarkers } from "./tileMarkers/createFieldMarkers.js";
import { validateMove } from "./helpers/validateMove.js";
import { checkForCheck } from "./gameFunctions/checkForCheck.js";
import { updateBoard, removeMarkers } from "./gameFunctions/updateBoard.js";
import { changeTurns } from "./helpers/changeTurns.js";
import { checkForCheckMate, checkForRemis } from "./gameFunctions/endGame.js";
import { RevertLastMoveInstructions } from "./helpers/RevertLastMoveInstructions.js";
import { invertColor } from "./helpers/invertColor.js";
import Board from "./components/Board";
import Dashboard from "./components/Dashboard";
import { checkForMovedKing } from "./helpers/movedRochadeFigures.js";

import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";

class ChessApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidUpdate = () => {
    if (this.props.game && !this.state.color) {
      let game = this.props.game;
      let color =
        game.users.findIndex(user => user.userId === Meteor.userId()) === 0
          ? "white"
          : game.users.findIndex(user => user.userId === Meteor.userId()) === 1
          ? "black"
          : "spectating";
      this.setState({ color });
    }
  };

  handleClick = field => {
    if (this.props.game && this.state.color === this.props.game.turn) {
      let { row, col } = convertPos(field);
      let game = this.props.game;
      let figure = game.board[row][col].figure;

      if (game.movePart === 1) {
        if (figure.color === game.figure.color) {
          Meteor.call("states.update", {
            _id: this.props.id,
            fieldsToUpdate: {
              board: createFieldMarkers(game.board, row, col, "valid"),
              movePart: 1,
              oldPos: { row, col },
              figure
            }
          });
        } else if (validateMove(game.board, row, col)) {
          let newPos = { row, col };
          let move = {
            figure: game.figure,
            oldPos: game.oldPos,
            newPos,
            secondFigure: figure
          };
          Meteor.call("states.update", {
            _id: this.props.id,
            fieldsToUpdate: {
              board: updateBoard(game.board, move),
              turn: changeTurns(game.turn),
              check: checkForCheck(game.board, game.turn),
              offerTakeback: false,
              movePart: 0,
              checkmate: checkForCheckMate(game.board, game.turn),
              remis:
                !checkForCheckMate(game.board, game.turn) &&
                checkForRemis(game.board, game.turn)
                  ? true
                  : false,
              moveHistory: [...game.moveHistory, move]
            }
          });
        } else {
          Meteor.call("states.update", {
            _id: this.props.id,
            fieldsToUpdate: {
              board: removeMarkers(game.board, ["valid", "selected"]),
              movePart: 0
            }
          });
        }
      } else if (figure.color === game.turn && game.turn) {
        Meteor.call("states.update", {
          _id: this.props.id,
          fieldsToUpdate: {
            board: createFieldMarkers(game.board, row, col, "valid"),
            movePart: 1,
            oldPos: { row, col },
            figure
          }
        });
      }
    }
  };
  handleUndo = () => {
    if (this.props.game && this.props.game.offerTakeback) {
      let game = this.props.game;
      let move = RevertLastMoveInstructions(game.moveHistory);
      Meteor.call("states.update", {
        _id: this.props.id,
        fieldsToUpdate: {
          board: updateBoard(game.board, move, false, true),
          turn: changeTurns(game.turn),
          movePart: 0,
          moveHistory: game.moveHistory.slice(0),
          check: checkForCheck(game.board, game.turn),
          checkmate: false,
          remis: false,
          offerTakeback: false
        }
      });
    }
  };
  proposeUndo = () => {
    if (this.props.game) {
      Meteor.call("states.update", {
        _id: this.props.id,
        fieldsToUpdate: {
          offerTakeback: true
        }
      });
    }
  };
  resetBoard = () => {
    Meteor.call("states.update", {
      _id: this.props.id,
      fieldsToUpdate: getDefaultState()
    });
  };
  render() {
    return this.props.game ? (
      <div className="gridContainer">
        <div className="sidebar">
          <p>
            Welcome to a round of chess! If you want to invite somebody to play
            - simply give them this link:
          </p>
          <a href={"/games/" + this.props.game._id}>Link to the game!</a>
        </div>
        <Board
          board={this.props.game.board}
          turnAround={this.state.color === "black" ? true : false}
          handleClick={this.handleClick}
        />
        <div className="sidebar">
          <Dashboard
            _id={this.props.game._id}
            checkmate={this.props.game.checkmate}
            remis={this.props.game.remis}
            turn={this.props.game.turn}
            resetBoard={this.resetBoard}
            proposeUndo={this.proposeUndo}
            handleUndo={this.handleUndo}
            offerTakeback={this.props.game.offerTakeback}
            moveHistory={this.props.game.moveHistory}
          />
        </div>
      </div>
    ) : (
      <div>Loading...</div>
    );
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
