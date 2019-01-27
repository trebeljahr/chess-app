import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

function getDefaultState() {
  return {
    board: generateBoard(),
    turn: "white",
    movePart: 0,
    check: false,
    checkmate: false,
  };
}

class ChessApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = getDefaultState();
    this.handleClick = this.handleClick.bind(this);
    this.resetBoard = this.resetBoard.bind(this);
  }
  handleClick(field) {
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
        if (
          checkForCheck(this.state.board, this.state.turn) &&
          this.state.check !== true
        ) {
          this.setState({ check: true });
        }
        this.setState({
          board: updateBoard(this.state.board, move),
          turn: changeTurns(this.state.turn),
          movePart: 0
        });
        if(checkForCheckMate(this.state.board, this.state.turn)){this.setState({checkmate: true})};
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

  resetBoard() {
    this.setState(getDefaultState());
  }

  render() {
    return (
      <div>
        <Board board={this.state.board} handleClick={this.handleClick} />
        <Dashboard checkmate={this.state.checkmate} turn={this.state.turn} />
        <ResetBoard resetBoard={this.resetBoard} />
      </div>
    );
  }
}

function Dashboard (props){
  return (
  <div>
      {props.checkmate?invertColor(props.turn) + " wins!":"It's " + props.turn + "'s turn"}
        </div>
  )
}
function invertColor(color){
  return color==="white"?"black":"white";
}

function findFigures(board, color){
let out = [];
for (let row = 0; row < 8; row++){
    for (let col = 0; col < 8; col++){
      let tile = board[row][col];
     if (tile.figure !== "noFigure" && tile.figure.color === color){
       out.push({row: row, col: col});
     }
    }
}
    return out;
}

function checkForCheckMate(board, color){
  board = JSON.parse(JSON.stringify(board));
  let possibleFiguresToMove = findFigures(board, invertColor(color));
 possibleFiguresToMove.map(tile=>{
   board = createFieldMarkers(board, tile.row, tile.col, "valid", true);
 })
  return areThereNoMoreValidMoves(board);
  }

function checkForRemis(board, row, col, color){

}

function areThereNoMoreValidMoves(board){
  for (let row = 0; row < 8; row++){
    for (let col = 0; col < 8; col++){
      let tile = board[row][col];
      if (tile.valid === "valid"){
        return false;
      }
    }
}
  return true;
}

function validateMove(board, row, col) {
  return board[row][col].valid === "valid" ? true : false;
}

function convertPos(pos) {
  return { row: 8 - pos[1], col: pos.charCodeAt(0) - 65 };
}

function createFieldMarkers(board, row, col, mark, virtual) {
  let maxDistance = 8;
  let figure = board[row][col].figure;
  if (mark === "valid" && !virtual) {
    removeMarkers(board, ["valid", "selected"]);
    board[row][col].selected = "selected";
  }
  switch (figure.type) {
    case "pawn":
      determinePawnMarkers(board, row, col, figure.color, mark);
      break;
    case "king":
      if (mark === "valid"){
        markRochade(board, row, col);
      }
    case "knight":
      maxDistance = 1;
      break;
    default:
      break;
  }

  for (let key in figure.allowedDirections) {
    let direction = figure.allowedDirections[key];
    board = markTiles(
      board,
      row,
      direction[0],
      col,
      direction[1],
      figure,
      maxDistance,
      0,
      mark,
      row,
      col,
      figure
    );
  }
  return board;
}

function determinePawnMarkers(board, row, col, color, mark) {
  let pawnRowTransformation = getPawnRowTransformations(row, color);
 if (mark === "valid")
	{straightPawnSteps(board, row, col, pawnRowTransformation)}
  diagonalPawnCaptures(board, row, col, color, mark);
}

function getPawnRowTransformations(row, color) {
  if (color === "white") {
    return row === 6 ? [-2, -1] : [-1];
  }
  if (color === "black") {
    return row === 1 ? [2, 1] : [1];
  }
}

function diagonalPawnCaptures(board, row, col, color, mark) {
  let rowChange = color === "white" ? -1 : 1;
  [-1, 1].map(y => {
    if (0 <= col + y && col + y <= 7) {
      let tile = board[row + rowChange][col + y];
      if (tile.figure !== "noFigure" && tile.figure.color !== color) {
        if (mark === "valid") {
        let boardCopy = JSON.parse(JSON.stringify(board));
        let move = {oldPos: {row: row, col: col}, newPos: {row: row+rowChange, col:col+y}, figure: board[row][col].figure}
        boardCopy = updateBoard(boardCopy, move, true);
        if (checkForCheck(boardCopy, board[row][col].figure.color)) {
        } else {
          tile[mark] = mark;
        }
        }
       else {tile[mark] = mark;}
      }
    }
  });
}

function straightPawnSteps(board, row, col, stepSize) {
  stepSize.map(x => {
    let tile = board[row + x][col];
    if (tile.figure === "noFigure") {
        let boardCopy = JSON.parse(JSON.stringify(board));
        let move = {oldPos: {row: row, col: col}, newPos: {row: row+x, col:col}, figure: board[row][col].figure}
        boardCopy = updateBoard(boardCopy, move, true);
        if (checkForCheck(boardCopy, board[row][col].figure.color)) {
        } else {
          tile.valid = "valid";
        }
    }
  });
}

function markRochade(board, row, col){
  if(IsLongRochadePossible(board, row, col)){board[row][col-2].valid="valid"}
  if(IsShortRochadePossible(board, row, col)){board[row][col+2].valid="valid"}
}

function IsLongRochadePossible(board, row, col, figure){
  let tile = board[row][col];
  if (col === 0 && tile.figure.type === "rook"){
    return true;
  }
  if (tile.check === "check" && col >= 2|| tile.figure !== "noFigure" && col !== 4) {
    return false;
  }
  return IsLongRochadePossible(board, row, col-1);
}

function IsShortRochadePossible(board, row, col){
  let tile = board[row][col];
  if (col === 7 && tile.figure.type === "rook"){
    return true;
  }
  if (tile.check === "check" && col <= 6 || tile.figure !== "noFigure" && col !== 4){
    return false;
  }
  return IsShortRochadePossible(board, row, col+1);
}

function markTiles(
  board,
  row,
  rowMovement,
  col,
  colMovement,
  figure,
  iterationMax,
  iterationCount,
  mark,
  oldRow,
  oldCol,
  oldFigure
) {
  let newRow = row + rowMovement;
  let newCol = col + colMovement;
  if (
    newCol > 7 ||
    newRow > 7 ||
    newCol < 0 ||
    newRow < 0 ||
    iterationCount >= iterationMax
  ) {
    return board;
  }
  iterationCount++;
  if (board[newRow][newCol].figure !== "noFigure") {
    if (board[newRow][newCol].figure.color !== figure.color) {
      if (mark === "valid") {
        let move = {
          oldPos: { row: oldRow, col: oldCol },
          newPos: { row: newRow, col: newCol },
          figure: oldFigure
        };
        let boardCopy = JSON.parse(JSON.stringify(board));
        boardCopy = updateBoard(boardCopy, move, true);
        if (checkForCheck(boardCopy, oldFigure.color)) {
        } else {
          board[newRow][newCol][mark] = mark;
        }
      } else {
        board[newRow][newCol][mark] = mark;
      }
    }
    return board;
  }
  if (mark === "valid") {
    let move = {
      oldPos: { row: oldRow, col: oldCol },
      newPos: { row: newRow, col: newCol },
      figure: oldFigure
    };
    let boardCopy = JSON.parse(JSON.stringify(board));
    boardCopy = updateBoard(boardCopy, move, true);
    if (checkForCheck(boardCopy, oldFigure.color)) {
    } else {
      board[newRow][newCol][mark] = mark;
    }
  }
    else {
      board[newRow][newCol][mark] = mark;
    }
  return markTiles(
    board,
    newRow,
    rowMovement,
    newCol,
    colMovement,
    figure,
    iterationMax,
    iterationCount,
    mark,
    oldRow,
    oldCol,
    oldFigure
  );
}

function createTilesUnderThreat(board, turn) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (
        board[row][col].figure !== "noFigure" &&
        board[row][col].figure.color === turn
      ) {
        createFieldMarkers(board, row, col, "check");
      }
    }
  }
}

function findKing(board, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (
        board[row][col].figure.type === "king" &&
        board[row][col].figure.color === color
      ) {
        return { row: row, col: col };
      }
    }
  }
}

function checkForCheck(board, color) {
  let { row, col } = findKing(board, color);
  if (board[row][col].check === "check") {
    return true;
  } else {
    return false;
  }
}

function updateBoard(board, move, virtual) {
  removeMarkers(board, ["valid", "selected", "check"]);
  removePiece(board, move.oldPos);
  generatePiece(board, move.newPos, move.figure, virtual);
  return board;
}

function removeMarkers(board, marks) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      marks.map(mark => {
        board[row][col][mark] = "";
      });
    }
  }
}

function removePiece(board, pos) {
  let { row, col } = pos;
  board[row][col].figure = "noFigure";
  return board;
}

function generatePiece(board, pos, figure, virtual) {
  let { row, col } = pos;
  board[row][col].figure = figure;
  virtual
    ? createTilesUnderThreat(
        board,
        figure.color === "white" ? "black" : "white"
      )
    : createTilesUnderThreat(board, figure.color);
  return board;
}

function changeTurns(turn) {
  return turn === "black" ? "white" : "black";
}

function generateBoard() {
  let board = [];
  for (let row = 0; row < 8; row++) {
    board.push([]);
    for (let col = 0; col < 8; col++) {
      board[row].push({
        field: String.fromCharCode(col + 65) + (8 - row),
        color: (row + col + 1) % 2 ? "white-tile" : "black-tile",
        check: "",
        valid: "",
        figure: generateFigure(col, row)
      });
    }
  }
  return board;
}

function ResetBoard(props) {
  return <button onClick={() => props.resetBoard()}>Reset!</button>;
}

function generateFigure(col, row) {
  let color = "";
  let type = "";
  let allowedDirections = {};
  switch (row) {
    case 1:
      type = "pawn";
    case 0:
      color = "black";
      break;
    case 6:
      type = "pawn";
    case 7:
      color = "white";
      break;
  }
  if (row === 7 || row === 0) {
    switch (col) {
      case 0:
      case 7:
        type = "rook";
        allowedDirections = {
          up: [-1, 0],
          down: [+1, 0],
          right: [0, +1],
          left: [0, -1]
        };
        break;
      case 1:
      case 6:
        type = "knight";
        allowedDirections = {
          "1": [-1, -2],
          "2": [-1, +2],
          "3": [+2, +1],
          "4": [+2, -1],
          "5": [+1, -2],
          "6": [+1, +2],
          "7": [-2, +1],
          "8": [-2, -1]
        };
        break;
      case 2:
      case 5:
        type = "bishop";
        allowedDirections = {
          "diagonal-1": [-1, -1],
          "diagonal-2": [+1, +1],
          "diagonal-3": [-1, +1],
          "diagonal-4": [+1, -1]
        };
        break;
      case 3:
        type = "queen";
        allowedDirections = {
          up: [-1, 0],
          down: [+1, 0],
          right: [0, +1],
          left: [0, -1],
          "diagonal-1": [-1, -1],
          "diagonal-2": [+1, +1],
          "diagonal-3": [-1, +1],
          "diagonal-4": [+1, -1]
        };
        break;
      case 4:
        type = "king";
        allowedDirections = {
          up: [-1, 0],
          down: [+1, 0],
          right: [0, +1],
          left: [0, -1],
          "diagonal-1": [-1, -1],
          "diagonal-2": [+1, +1],
          "diagonal-3": [-1, +1],
          "diagonal-4": [+1, -1]
        };
        break;
    }
  }
  if (color) {
    return { color: color, type: type, allowedDirections: allowedDirections };
  }
  return "noFigure";
}

function Board(props) {
  return (
    <div className="board">
      {props.board.map(row =>
        row.map(col => {
          return (
            <div
              onClick={() => props.handleClick(col.field)}
              id={col.field}
              className={
                col.color +
                " " +
                (col.figure.type === "king" && col.check === "check"
                  ? col.check
                  : "") +
                " " +
                col.selected
              }
            >
              <div className={col.valid}>
                <span
                  className={
                    col.figure.type
                      ? "fas " +
                        "fa-chess-" +
                        col.figure.type +
                        " " +
                        col.figure.color
                      : ""
                  }
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}


export default ChessApp;
