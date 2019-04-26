import React from "react";
import { invertColor } from "../../helpers/invertColor.js";
const TextContainer = ({ color, checkmate, turn, remis }) => (
  <h4 style={{ gridArea: "b" }}>
    {color === "none"
      ? checkmate
        ? invertColor(turn) + " wins!"
        : remis
        ? "It's a draw!"
        : "It's " + turn + "'s turn"
      : checkmate
      ? invertColor(turn) === color
        ? "You win"
        : "Your opponent wins!"
      : remis
      ? "It's a draw!"
      : "It's" + (turn === color ? " your" : " your opponents") + " turn"}
    <style jsx>{`
      h4 {
        margin: 0;
        padding: 0;
        font-weight: bold;
      }
    `}</style>
  </h4>
);
export default TextContainer;
