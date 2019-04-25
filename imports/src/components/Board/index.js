import React from "react";

const Board = props => {
  return (
    <div
      className={
        "board" +
        (props.turnAround ? " turnToBlackPlayer" : " turnToWhitePlayer")
      }
    >
      {props.board.map(row =>
        row.map(col => {
          return (
            <div
              onClick={() => props.handleClick(col.field)}
              key={col.field}
              className={
                col.color +
                " " +
                (col.figure.type === "king" && col.check === "check"
                  ? col.check
                  : "") +
                " " +
                (col.selected ? col.selected : "")
              }
            >
              <div className={col.valid + " " + col.rochade}>
                <span
                  className={
                    col.figure.type
                      ? "fas " +
                        "fa-chess-" +
                        col.figure.type +
                        " " +
                        col.figure.color +
                        (props.turnAround
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
      `}</style>
    </div>
  );
};
export default Board;
