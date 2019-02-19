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
import { flagWhichRochadeFiguresHaveBeenMoved } from "./helpers/flagWhichRochadeFiguresHaveBeenMoved.js";
import { RevertLastMoveInstructions } from "./helpers/RevertLastMoveInstructions.js";
import { invertColor } from "./helpers/invertColor.js";
import Board from "./components/Board";
import Dashboard from "./components/Dashboard";
import UndoButton from "./components/UndoButton";
import ResetBoard from "./components/ResetBoard";

class ChessApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = getDefaultState();
  }
  handleClick = (field) => {
    let { row, col } = convertPos(field);
    let fieldContent = this.state.board[row][col];
    if (this.state.movePart === 1) {
      if (fieldContent.figure.color === this.state.figure.color) {
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
        this.setState(state => {
          return state.turn === "white"
            ? {
                white: flagWhichRochadeFiguresHaveBeenMoved(
                  state.moveHistory,
                  state.white,
                  invertColor(state.turn)
                )
              }
            : {
                black: flagWhichRochadeFiguresHaveBeenMoved(
                  state.moveHistory,
                  state.black,
                  invertColor(state.turn)
                )
              };
        });
      }
    } else if (fieldContent.figure.color === this.state.turn) {
      this.setState({
        board: createFieldMarkers(this.state.board, row, col, "valid"),
        movePart: 1,
        oldPos: { row, col },
        figure: fieldContent.figure
      });
    }
  }
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
  }

  resetBoard = () => {
    this.setState(getDefaultState());
  }

  render() {
    return (
      <div>
        <Board board={this.state.board} handleClick={this.handleClick} />
        <Dashboard
          checkmate={this.state.checkmate}
          remis={this.state.remis}
          turn={this.state.turn}
        />
        <ResetBoard resetBoard={this.resetBoard} />
        <UndoButton
          handleUndo={this.handleUndo}
          moveHistory={this.state.moveHistory}
        />
      </div>
    );
  }
}

export default ChessApp;
