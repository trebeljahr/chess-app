import React from "react";
const PawnChangeInterface = ({ baseLinePawn, turn, color, continueTurn }) => {
  if (baseLinePawn && color === turn) {
    return (
      <div className="grey">
        <span
          onClick={() => this.continueTurn("knight")}
          className={"fas fa-chess-knight " + color}
        />
        <span
          onClick={() => this.continueTurn("bishop")}
          className={"fas fa-chess-bishop " + color}
        />
        <span
          onClick={() => this.continueTurn("rook")}
          className={"fas fa-chess-rook " + color}
        />
        <span
          onClick={() => this.continueTurn("queen")}
          className={"fas fa-chess-queen " + color}
        />
      </div>
    );
  } else {
    return <div />;
  }
};
export default PawnChangeInterface;
