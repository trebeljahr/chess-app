import React from "react";
import "./App.css";
import { getDefaultState } from "./helpers/getDefaultState.js";
import { convertPos } from "./helpers/convertPos.js";
import { createFieldMarkers } from "./tileMarkers/createFieldMarkers.js";
import { validateMove } from "./helpers/validateMove.js";
import { checkForCheck } from "./gameFunctions/checkForCheck.js";
import { updateBoard } from "./gameFunctions/updateBoard.js";
import { changeTurns } from "./helpers/changeTurns.js";
import { checkForCheckMate } from "./gameFunctions/checkForCheckMate.js";
import { checkForRemis } from "./gameFunctions/checkForRemis.js";
import { RevertLastMoveInstructions } from "./helpers/RevertLastMoveInstructions.js";
import { invertColor } from "./helpers/invertColor.js";
import Board from "./components/Board";
import Dashboard from "./components/Dashboard";
import UndoButton from "./components/UndoButton";
import ResetBoard from "./components/ResetBoard";
import { checkForMovedKing } from "./helpers/movedRochadeFigures.js";

import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../api/states.js";

class ChessApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = getDefaultState();
  }
  handleClick = field => {
    let { row, col } = convertPos(field);
    let fieldContent = this.props.board[row][col];
    if (this.state.movePart === 1) {
      if (fieldContent.figure.color === this.state.figure.color) {
        if (row === this.state.oldPos.row && col === this.state.oldPos.col) {
          this.setState(state => {});
        }
        this.setState(state => {
          return {
            board: createFieldMarkers(state.board, row, col, "valid"),
            movePart: 1,
            oldPos: { row, col },
            figure: fieldContent.figure
          };
        });
      } else if (validateMove(this.state.board, row, col)) {
        let newPos = { row, col };
        let move = {
          figure: this.state.figure,
          oldPos: this.state.oldPos,
          newPos: newPos
        };
        let moveHistoryCopy = [...this.state.moveHistory];
        moveHistoryCopy.push(move);
        if (
          checkForCheck(this.state.board, this.state.turn) &&
          this.state.check !== true
        ) {
          this.setState({ check: true });
        }
        this.setState({
          board: updateBoard(this.state.board, move),
          turn: changeTurns(this.state.turn),
          movePart: 0,
          moveHistory: moveHistoryCopy
        });
        if (checkForCheckMate(this.state.board, this.state.turn)) {
          this.setState({ checkmate: true });
        }
        if (checkForRemis(this.state.board, this.state.turn)) {
          this.setState({ remis: true });
        }
      }
    } else if (fieldContent.figure.color === this.state.turn) {
      this.setState({
        board: createFieldMarkers(this.state.board, row, col, "valid"),
        movePart: 1,
        oldPos: { row, col },
        figure: fieldContent.figure
      });
    }
  };
  handleUndo = () => {
    let move = RevertLastMoveInstructions(this.state.moveHistory);
    this.setState({
      board: updateBoard(this.state.board, move),
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
