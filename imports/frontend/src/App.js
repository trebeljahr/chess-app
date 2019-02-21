import React from "react";
import "./App.css";
import { getDefaultState } from "./helpers/getDefaultState.js";
import { convertPos } from "./helpers/convertPos.js";
import { createFieldMarkers } from "./tileMarkers/createFieldMarkers.js";
import { validateMove } from "./helpers/validateMove.js";
import { checkForCheck } from "./gameFunctions/checkForCheck.js";
import { updateBoard, removeMarkers } from "./gameFunctions/updateBoard.js";
import { changeTurns } from "./helpers/changeTurns.js";
import { checkForCheckMate } from "./gameFunctions/checkForCheckMate.js";
import { checkForRemis } from "./gameFunctions/checkForRemis.js";
import { RevertLastMoveInstructions } from "./helpers/RevertLastMoveInstructions.js";
import { invertColor } from "./helpers/invertColor.js";
import { checkForMovedKing } from "./helpers/movedRochadeFigures.js";

import Board from "./components/Board";
import Dashboard from "./components/Dashboard";

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
  componentDidUpdate = () => {};
  resetBoard = () => {
    this.setState(getDefaultState());
  };
  render() {
    return (
      <div>
        <Board board={this.state.board} handleClick={this.handleClick} />
        <div>
          <Dashboard
            checkmate={this.state.checkmate}
            remis={this.state.remis}
            turn={this.state.turn}
            resetBoard={this.resetBoard}
            handleUndo={this.handleUndo}
            moveHistory={this.state.moveHistory}
          />
        </div>
      </div>
    );
  }
}

export default ChessApp;
