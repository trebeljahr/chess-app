import React from "react";
import { convertPos } from "../../helpers/convertPos.js";

const Board = ({ board, handleClick, turn, color, lastMove, archived }) => (
  <div
    className={
      "board" +
      (color === "black" ? " turnToBlackPlayer" : " turnToWhitePlayer")
    }
  >
    {board.map(row =>
      row.map(tile => {
        let pos = convertPos(tile.field);
        let oldP;
        let newP;
        if (lastMove && !archived) {
          oldP = lastMove.oldPos;
          newP = lastMove.newPos;
        }
        return (
          <div
            onClick={archived ? null : () => handleClick(tile.field)}
            key={tile.field}
            className={
              tile.color +
              " " +
              (tile.figure.type === "king" && tile.check === "check"
                ? tile.check
                : "") +
              " " +
              (tile.selected && color === turn ? tile.selected : "")
            }
          >
            <div
              className={
                (color === turn ? tile.valid + " " + tile.rochade : "") +
                " " +
                (((oldP && oldP.row === pos.row && oldP.col === pos.col) ||
                  (newP && newP.row === pos.row && newP.col === pos.col)) &&
                turn === color
                  ? "old"
                  : "")
              }
            >
              <span
                className={
                  tile.figure.type
                    ? "fas " +
                      "fa-chess-" +
                      tile.figure.type +
                      " " +
                      tile.figure.color +
                      (color === "black"
                        ? " turnToBlackPlayer"
                        : " turnToWhitePlayer")
                    : ""
                }
              />
            </div>
          </div>
        );
      })
    )}
    <style jsx>{`
      .board {
        border: none;
        display: grid;
        width: 80vmin;
        height: 80vmin;
        grid-template-rows: repeat(8, 10vmin);
        grid-template-columns: repeat(8, 10vmin);
      }
      .old {
        width: 90%;
        height: 90%;
        border-radius: 100%;
        background: darkgray;
      }
      .board div {
        font-size: 3vmin;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .turnToBlackPlayer {
        transform: translateZ(0px) rotate(180deg);
      }
      .selected {
        background: #5f939b !important;
      }
      .check {
        background: #f55d3e !important;
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
      @media (orientation: portrait) {
        .board {
          width: 100vmin;
          height: 100vmin;
          grid-template-rows: repeat(8, 12.5vmin);
          grid-template-columns: repeat(8, 12.5vmin);
          margin-bottom: 30px;
          padding: 0;
        }
      }
    `}</style>
  </div>
);

export default Board;
