import React from "react";
const PawnChangeInterface = ({ baseLinePawn, turn, color, continueTurn }) => {
  if (baseLinePawn && color === turn) {
    return (
      <div className="attach">
        <div className="grey">
          <span
            onClick={() => continueTurn("knight")}
            className={"fas fa-chess-knight " + color}
          />
          <span
            onClick={() => continueTurn("bishop")}
            className={"fas fa-chess-bishop " + color}
          />
          <span
            onClick={() => continueTurn("rook")}
            className={"fas fa-chess-rook " + color}
          />
          <span
            onClick={() => continueTurn("queen")}
            className={"fas fa-chess-queen " + color}
          />
        </div>
        <style jsx>{`
          .grey {
            width: 90vmin;
            height: 15vmin;
            padding: 10px;
            background: grey;
            display: flex;
            justify-content: space-around;
            align-items: center;
          }
          .grey > span {
            font-size: 2em;
            margin: 0;
            padding: 0;
          }
          .attach {
            width: 100%;
            display: flex;
            justify-content: center;
          }
          @media (orientation: landscape) {
            .grey {
              width: auto;
              flex-direction: column;
              height: 90vmin;
              padding: 0 10px;
            }
            .attach {
              width: auto;
              flex-direction: column;
              align-items: center;
            }
          }
        `}</style>
      </div>
    );
  } else {
    return <div />;
  }
};
export default PawnChangeInterface;
