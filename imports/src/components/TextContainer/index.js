import React from "react";
import { invertColor } from "../../helpers/invertColor.js";
const TextContainer = ({ color, checkmate, turn, remis }) => (
  <div style={{ gridArea: "b" }} className="textContainer">
    {color === "none" ? (
      <p>
        {checkmate
          ? invertColor(turn) + " wins!"
          : remis
          ? "It's a draw!"
          : "It's " + turn + "'s turn"}
      </p>
    ) : checkmate ? (
      invertColor(turn) === color ? (
        <p>You win</p>
      ) : (
        <p>Your opponent wins!</p>
      )
    ) : remis ? (
      <p>It's a draw!</p>
    ) : (
      <p>
        It's
        {(turn === color ? " your" : " your opponents") + " turn"}
      </p>
    )}
  </div>
);
export default TextContainer;
