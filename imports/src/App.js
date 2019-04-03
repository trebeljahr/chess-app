import React from "react";
import "./App.css";
import { getDefaultState } from "./helpers/getDefaultState.js";
import { convertPos } from "./helpers/convertPos.js";
import { createFieldMarkers } from "./tileMarkers/createFieldMarkers.js";
import { validateMove } from "./helpers/validateMove.js";
import { checkForCheck } from "./gameFunctions/checkForCheck.js";
import { updateBoard, removeMarkers } from "./gameFunctions/updateBoard.js";
import { checkForCheckMate, checkForRemis } from "./gameFunctions/endGame.js";
import { RevertLastMoveInstructions } from "./helpers/RevertLastMoveInstructions.js";
import { invertColor } from "./helpers/invertColor.js";
import { createTilesUnderThreat } from "./tileMarkers/createTilesUnderThreat.js";
import Board from "./components/Board";
import Dashboard from "./components/Dashboard";
import { checkForMovedKing } from "./helpers/movedRochadeFigures.js";

import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";

class ChessApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = { baseLinePawn: false };
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
    if (
      this.props.game &&
      this.state.color === this.props.game.turn &&
      this.state.baseLinePawn === false
    ) {
      let { row, col } = convertPos(field);
      let game = this.props.game;
      let figure = game.board[row][col].figure;
      if (game.movePart === 1) {
        if (figure.color === game.figure.color) {
          Meteor.call("states.update", {
            _id: this.props.id,
            fieldsToUpdate: {
              board: createFieldMarkers(
                game.board,
                row,
                col,
                "valid",
                false,
                game.moveHistory
              ),
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

          if (game.board[row][col].rochade) {
            move.rochadeRook = {
              figure: game.board[row][col === 6 ? 7 : 0].figure,
              oldPos: { row, col: col === 6 ? 7 : 0 },
              newPos: { row, col: col === 6 ? 5 : 3 }
            };
          }
          if (game.board[row][col].enpassen) {
            let lastMove = game.moveHistory[game.moveHistory.length - 1];
            let enPassenRow = lastMove.newPos.row;
            let enPassenCol = lastMove.newPos.col;
            move.enPassen = {
              figure: game.board[enPassenRow][enPassenCol].figure,
              pos: { row: enPassenRow, col: enPassenCol }
            };
          }
          let baseLinePawn = false;
          if (game.figure.type === "pawn" && (row === 0 || row === 7)) {
            this.setState(() => ({ baseLinePawn: { row, col } }));
            baseLinePawn = true;
          }
          if (baseLinePawn === false) {
            Meteor.call("states.update", {
              _id: this.props.id,
              fieldsToUpdate: {
                board: updateBoard(game.board, move),
                turn: invertColor(game.turn),
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
                board: updateBoard(game.board, move),
                moveHistory: [...game.moveHistory, move]
              }
            });
          }
        } else {
          Meteor.call("states.update", {
            _id: this.props.id,
            fieldsToUpdate: {
              board: removeMarkers(game.board, [
                "valid",
                "selected",
                "rochade"
              ]),
              movePart: 0
            }
          });
        }
      } else if (figure.color === game.turn && game.turn) {
        Meteor.call("states.update", {
          _id: this.props.id,
          fieldsToUpdate: {
            board: createFieldMarkers(
              game.board,
              row,
              col,
              "valid",
              false,
              game.moveHistory
            ),
            movePart: 1,
            oldPos: { row, col },
            figure
          }
        });
      }
    }
  };
  handleUndo = () => {
    if (
      this.props.game &&
      this.props.game.offerTakeback === invertColor(this.state.color)
    ) {
      let game = this.props.game;
      let move = RevertLastMoveInstructions(game.moveHistory);
      let board = removeMarkers(updateBoard(game.board, move, false, true), [
        "valid",
        "selected",
        "rochade",
        "check"
      ]);
      board = createTilesUnderThreat(board, game.turn);
      Meteor.call("states.update", {
        _id: this.props.id,
        fieldsToUpdate: {
          board: board,
          movePart: 0,
          moveHistory: game.moveHistory.slice(0),
          check: checkForCheck(board, game.turn),
          turn: invertColor(game.turn),
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
          offerTakeback: this.state.color
        }
      });
    }
  };
  revertUndoProposal = () => {
    if (this.props.game) {
      Meteor.call("states.update", {
        _id: this.props.id,
        fieldsToUpdate: {
          offerTakeback: false
        }
      });
    }
  };
  continueTurn = figure => {
    if (this.props.game) {
      let game = this.props.game;
      let { row, col } = this.state.baseLinePawn;
      game.board[row][col].figure.type = figure;
      game.board = createTilesUnderThreat(game.board, game.turn);
      Meteor.call(
        "states.update",
        {
          _id: this.props.id,
          fieldsToUpdate: {
            board: game.board,
            turn: invertColor(game.turn),
            check: checkForCheck(game.board, game.turn),
            offerTakeback: false,
            movePart: 0,
            checkmate: checkForCheckMate(game.board, game.turn),
            remis:
              !checkForCheckMate(game.board, game.turn) &&
              checkForRemis(game.board, game.turn)
                ? true
                : false
          }
        },
        () => {
          this.setState({ baseLinePawn: false });
        }
      );
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
      <div className="AppContainer">
        <p className="GameTitle">Game: {this.props.game.name}</p>
        <Board
          board={this.props.game.board}
          turnAround={this.state.color === "black" ? true : false}
          handleClick={this.handleClick}
        />
        <div className="sidebar">
          {this.state.baseLinePawn ? (
            <div className="grey">
              <span
                onClick={() => this.continueTurn("knight")}
                className={"fas fa-chess-knight " + this.state.color}
              />
              <span
                onClick={() => this.continueTurn("bishop")}
                className={"fas fa-chess-bishop " + this.state.color}
              />
              <span
                onClick={() => this.continueTurn("rook")}
                className={"fas fa-chess-rook " + this.state.color}
              />
              <span
                onClick={() => this.continueTurn("queen")}
                className={"fas fa-chess-queen " + this.state.color}
              />
            </div>
          ) : null}
          <Dashboard
            _id={this.props.game._id}
            checkmate={this.props.game.checkmate}
            remis={this.props.game.remis}
            turn={this.props.game.turn}
            color={this.state.color}
            revertUndoProposal={this.revertUndoProposal}
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
