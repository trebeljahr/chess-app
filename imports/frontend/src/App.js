import React from "react";
import "./App.css";
import { getDefaultState } from "./helpers/getDefaultState.js";
import { createFieldMarkers } from "./tileMarkers/createFieldMarkers.js";
import { changeTurns } from "./helpers/changeTurns.js";
import { invertColor } from "./helpers/invertColor.js";
import { findFigures } from "./helpers/findFigures.js";
import { convertPos } from "./helpers/convertPos.js";
import { validateMove } from "./helpers/validateMove.js";
import { checkForCheck } from "./gameFunctions/checkForCheck.js";
import { updateBoard, removeMarkers } from "./gameFunctions/updateBoard.js";
import { checkForCheckMate, checkForRemis } from "./gameFunctions/endGame.js";
import { RevertLastMoveInstructions } from "./helpers/RevertLastMoveInstructions.js";
import { checkForMovedKing } from "./helpers/movedRochadeFigures.js";
import Board from "./components/Board";
import Dashboard from "./components/Dashboard";

import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../api/states.js";

class ChessApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = getDefaultState();
  }
  handleClick = field => {
    let { row, col } = convertPos(field);
    let figure = this.state.board[row][col].figure;
    if (this.state.movePart === 1) {
      if (figure.color === this.state.figure.color) {
        this.setState(state => {
          return {
            board: createFieldMarkers(state.board, row, col, "valid"),
            movePart: 1,
            oldPos: { row, col },
            figure
          };
        });
      } else if (validateMove(this.state.board, row, col)) {
        let newPos = { row, col };
        let move = {
          figure: this.state.figure,
          oldPos: this.state.oldPos,
          newPos,
          secondFigure: figure
        };
        this.setState(state => {
          return {
            board: updateBoard(state.board, move),
            turn: changeTurns(state.turn),
            check: checkForCheck(state.board, state.turn),
            movePart: 0,
            checkmate: checkForCheckMate(state.board, state.turn),
            remis:
              !checkForCheckMate(state.board, state.turn) &&
              checkForRemis(state.board, state.turn)
                ? true
                : false,
            moveHistory: [...state.moveHistory, move]
          };
        });
      } else {
        this.setState(state => {
          return {
            board: removeMarkers(state.board, ["valid", "selected"]),
            movePart: 0
          };
        });
      }
    } else if (figure.color === this.state.turn) {
      this.setState({
        board: createFieldMarkers(this.state.board, row, col, "valid"),
        movePart: 1,
        oldPos: { row, col },
        figure
      });
    }
  };

  handleUndo = () => {
    let move = RevertLastMoveInstructions(this.state.moveHistory);
    this.setState({
      board: updateBoard(this.state.board, move, false, true),
      turn: changeTurns(this.state.turn),
      movePart: 0,
      check: checkForCheck(this.state.board, this.state.turn),
      checkmate: false,
      remis: false
    });
  };
  resetBoard = () => {
    Meteor.call("states.update");
  };

  render() {
    return this.props.states.map(state => (
      <div key={state._id}>
        <Board
          board={state.board}
          turnAround={state.turn === "black"}
          handleClick={this.handleClick}
        />
        <Dashboard
          checkmate={state.checkmate}
          remis={state.remis}
          turn={state.turn}
        />
        <ResetBoard resetBoard={this.resetBoard} />
        <UndoButton
          handleUndo={this.handleUndo}
          moveHistory={state.moveHistory}
        />
      </div>
    ));
  }
}

export default withTracker(({ id }) => {
  Meteor.subscribe("states.public");
  return { states: States.find({ _id: "zZdYxLYtTnWZYJ9Wh" }).fetch() };
})(ChessApp);
