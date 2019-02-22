import React from "react";

const Board = props => {
  return (
    <div className={"board" + (props.turnAround ? " turnAround" : "")}>
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
              <div className={col.valid}>
                <span
                  className={
                    col.figure.type
                      ? "fas " +
                        "fa-chess-" +
                        col.figure.type +
                        " " +
                        col.figure.color +
                        (props.turnAround ? " turnAround" : "")
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
};
export default Board;
