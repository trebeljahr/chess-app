import { Mongo } from "meteor/mongo";
import { getDefaultState } from "../src/helpers/getDefaultState.js";
import { convertPos } from "../src/helpers/convertPos.js";
import { createFieldMarkers } from "../src/tileMarkers/createFieldMarkers.js";
import { validateMove } from "../src/helpers/validateMove.js";
import { updateBoard } from "../src/gameFunctions/updateBoard.js";
import { removeMarkers } from "../src/gameFunctions/updateBoard.js";
import { invertColor } from "../src/helpers/invertColor.js";
import { checkForCheck } from "../src/gameFunctions/checkForCheck.js";
import { checkForRemis } from "../src/gameFunctions/endGame.js";
import { checkForCheckMate } from "../src/gameFunctions/endGame.js";
import { createTilesUnderThreat } from "../src/tileMarkers/createTilesUnderThreat.js";
import { RevertLastMoveInstructions } from "../src/helpers/RevertLastMoveInstructions.js";
export const States = new Mongo.Collection("states");
if (Meteor.isServer) {
  Meteor.publish("states", function statesPublication() {
    return States.find();
  });
  Meteor.publish("userData", function() {
    if (this.userId) {
      return Meteor.users.find(
        { _id: this.userId },
        {
          fields: { games: 1 }
        }
      );
    } else {
      this.ready();
    }
  });
}

Meteor.methods({
  "states.userEntersGame"({ _id, color }) {
    let { users } = States.findOne(_id);
    States.update(_id, {
      $set: {
        users: [
          ...users,
          {
            color,
            userId: Meteor.userId(),
            name: Meteor.user().username,
            timeStamp: Date.now()
          }
        ]
      }
    });
  },
  "states.updateUserTimeStamp"({ _id }) {
    let { users } = States.findOne(_id);
    users.find(user => Meteor.userId() === user.userId).timeStamp = Date.now();
    States.update({ _id }, { $set: { users } });
    return States.findOne(_id).users;
  },
  "states.createNew"({ name }) {
    let user = Meteor.users.findOne({ _id: Meteor.userId() });
    let activeGames = user.games
      ? user.games.filter(game => !States.findOne({ _id: game._id }).archived)
      : [];
    if (activeGames.length >= 200 || !Meteor.userId()) {
      return false;
    } else {
      States.insert({ name, ...getDefaultState() });
      let game = States.findOne({ name });
      Meteor.users.update(
        { _id: Meteor.userId() },
        {
          $set: {
            games: user.games
              ? [...user.games, { _id: game._id, name: game.name }]
              : [{ _id: game._id, name: game.name }]
          }
        }
      );
      return States.findOne({ name });
    }
  },
  "states.deleteGame"({ _id }) {
    let game = States.findOne({ _id });
    let user = Meteor.users.findOne({ _id: Meteor.userId() });
    let newGamesArray = user.games.filter(g => g._id !== game._id);
    if (Meteor.userId() === game.users[0].userId && game.users.length === 1) {
      States.remove({ _id });
      Meteor.users.update(
        { _id: Meteor.userId() },
        {
          $set: {
            games: newGamesArray
          }
        }
      );
    }
  },
  "states.addNewMessage"({ _id, message }) {
    let { messages } = States.findOne(_id);
    States.update(_id, { $set: { messages: [...messages, message] } });
  },
  "states.handleFirstClick"({ _id, field, userId }) {
    if (!userId) {
      return;
    }
    let { board, users, turn, moveHistory, baseLinePawn } = States.findOne(_id);
    let { row, col } = convertPos(field);
    let user = users.find(user => user.userId === userId);
    let tile = board[row][col];
    if (
      turn === user.color &&
      tile.figure != "noFigure" &&
      tile.figure.color === user.color &&
      !baseLinePawn
    ) {
      States.update(_id, {
        $set: {
          board: createFieldMarkers(
            board,
            row,
            col,
            "valid",
            false,
            moveHistory
          ),
          movePart: 1,
          oldPos: { row, col },
          figure: tile.figure
        }
      });
    }
  },
  "states.handleSecondClick"({ _id, field, userId }) {
    let {
      board,
      users,
      turn,
      moveHistory,
      figure,
      oldPos,
      baseLinePawn,
      oldBoards
    } = States.findOne(_id);
    let { row, col } = convertPos(field);
    let user = users.find(user => user.userId === userId);
    let tile = board[row][col];
    if (!userId || baseLinePawn !== false) {
      return;
    }
    if (turn === user.color) {
      if (tile.figure.color === figure.color) {
        States.update(_id, {
          $set: {
            board: createFieldMarkers(
              board,
              row,
              col,
              "valid",
              false,
              moveHistory
            ),
            movePart: 1,
            oldPos: { row, col },
            figure: tile.figure
          }
        });
      } else if (validateMove(board, row, col)) {
        let newPos = { row, col };
        let move = {
          figure,
          oldPos,
          newPos,
          secondFigure: tile.figure
        };
        if (board[row][col].rochade) {
          move.rochadeRook = {
            figure: board[row][col === 6 ? 7 : 0].figure,
            oldPos: { row, col: col === 6 ? 7 : 0 },
            newPos: { row, col: col === 6 ? 5 : 3 }
          };
        }
        if (tile.enpassen) {
          let lastMove = moveHistory[moveHistory.length - 1];
          let enPassenRow = lastMove.newPos.row;
          let enPassenCol = lastMove.newPos.col;
          move.enPassen = {
            figure: board[enPassenRow][enPassenCol].figure,
            pos: { row: enPassenRow, col: enPassenCol }
          };
        }
        let baseLinePawn = false;
        if (figure.type === "pawn" && (row === 0 || row === 7)) {
          States.update(_id, {
            $set: { baseLinePawn: { row, col } }
          });
          baseLinePawn = true;
        }
        if (baseLinePawn === false) {
          States.update(_id, {
            $set: {
              board: updateBoard(board, move),
              oldBoards: [...oldBoards, board],
              turn: invertColor(turn),
              check: checkForCheck(board, turn),
              offerTakeback: false,
              movePart: 0,
              checkmate: checkForCheckMate(board, turn),
              remis:
                !checkForCheckMate(board, turn) && checkForRemis(board, turn)
                  ? true
                  : false,
              moveHistory: [...moveHistory, move],
              archived:
                checkForCheckMate(board, turn) || checkForRemis(board, turn)
            }
          });
        } else {
          States.update(_id, {
            $set: {
              board: updateBoard(board, move),
              moveHistory: [...moveHistory, move]
            }
          });
        }
      } else {
        States.update(_id, {
          $set: {
            board: removeMarkers(board, [
              "valid",
              "selected",
              "rochade",
              "enpassen"
            ]),
            movePart: 0
          }
        });
      }
    }
  },
  "states.handlePawnChange"({ _id, figure }) {
    if (!this.userId) {
      return;
    }
    let { board, baseLinePawn, turn, oldBoards } = States.findOne(_id);
    let { row, col } = baseLinePawn;
    board[row][col].figure.type = figure;
    board = createTilesUnderThreat(board, turn);
    States.update(_id, {
      $set: {
        board: board,
        oldBoards: [...oldBoards, board],
        turn: invertColor(turn),
        check: checkForCheck(board, turn),
        offerTakeback: false,
        movePart: 0,
        checkmate: checkForCheckMate(board, turn),
        remis:
          !checkForCheckMate(board, turn) && checkForRemis(board, turn)
            ? true
            : false,
        baseLinePawn: false,
        archived: checkForCheckMate(board, turn) || checkForRemis(board, turn)
      }
    });
  },
  "states.proposeUndo"({ _id }) {
    if (!Meteor.userId()) {
      return;
    }
    let { users } = States.findOne({ _id });
    let color = users.find(user => user.userId === Meteor.userId()).color;
    States.update(_id, {
      $set: {
        offerTakeback: color
      }
    });
  },
  "states.revertUndoProposal"({ _id }) {
    if (!Meteor.userId()) {
      return;
    }
    let { users } = States.findOne({ _id });
    let color = users.find(user => user.userId === Meteor.userId()).color;
    States.update(_id, {
      $set: {
        offerTakeback: false
      }
    });
  },
  "states.goBackInTime"({ _id, index }) {
    let { oldBoards, archived } = States.findOne({ _id });
    if (!Meteor.userId() || !archived) {
      return;
    }
    let board = oldBoards[index];
    States.update(_id, {
      $set: {
        board: oldBoards[index]
      }
    });
  },
  "states.handleUndo"({ _id }) {
    if (!Meteor.userId()) {
      return;
    }
    let {
      board,
      baseLinePawn,
      turn,
      offerTakeback,
      moveHistory,
      users,
      oldBoards
    } = States.findOne({ _id });
    let color = users.find(user => user.userId === Meteor.userId()).color;
    if (offerTakeback === invertColor(color)) {
      let move = RevertLastMoveInstructions(moveHistory);
      board = removeMarkers(updateBoard(board, move, false, true), [
        "valid",
        "selected",
        "rochade",
        "check",
        "enpassen"
      ]);
      board = createTilesUnderThreat(board, turn);
      States.update(_id, {
        $set: {
          board,
          movePart: 0,
          moveHistory: moveHistory.slice(0),
          oldBoards: oldBoards.slice(0),
          check: checkForCheck(board, turn),
          turn: invertColor(turn),
          checkmate: false,
          remis: false,
          offerTakeback: false,
          baseLinePawn: false
        }
      });
    }
  }
});
