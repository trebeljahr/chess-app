import React from "react";
import { invertColor } from "../../helpers/invertColor.js";
const Dashboard = props => {
  return (
    <div>
      {props.checkmate
        ? invertColor(props.turn) + " wins!"
        : props.remis
        ? "It's a draw!"
        : "It's " + props.turn + "'s turn"}
    </div>
  );
};

export default Dashboard;
