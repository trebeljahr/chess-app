import React from "react";
const PawnChangeInterface = ({ baseLinePawn, turn, color, continueTurn }) => {
  if (baseLinePawn && color === turn) {
    return (
      <div className="blue">
        <span
          onClick={() => continueTurn("knight")}
          className={"fas fa-chess-knight fa-2x " + color}
        />
        <span
          onClick={() => continueTurn("bishop")}
          className={"fas fa-chess-bishop fa-2x " + color}
        />
        <span
          onClick={() => continueTurn("rook")}
          className={"fas fa-chess-rook fa-2x " + color}
        />
        <span
          className={"fas fa-chess-queen fa-2x " + color}
          onClick={() => continueTurn("queen")}
        />
        <style jsx>{`
          .blue {
            position: relative;
            z-index: 2;
            width: 80vmin;
            height: 10vmin;
            background: #258ea6;
            display: flex;
            justify-content: space-around;
            align-items: center;
          }
          span {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .white {
            color: white;
          }
          .black {
            color: black;
          }
          .black:hover {
            background: red;
          }
          .white:hover {
            background: red;
          }
          .grey > span {
            font-size: 2em;
            margin: 0;
            padding: 0;
          }
          .attach {
            display: flex;
            position: relative;
            z-index: 2;
          }
          @media only screen and (min-aspect-ratio: 7/5) {
            .blue {
              width: auto;
              flex-direction: column;
              height: 80vmin;
              width: 10vmin;
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
