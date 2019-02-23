import React from "react";
import "./Dashboard.css";
import { invertColor } from "../../helpers/invertColor.js";
import ResetBoard from "../ResetBoard";
import UndoButton from "../UndoButton";
const Dashboard = props => {
  return (
    <div className="flex-container">
      {/*props.moveHistory.map((move, index) => {
        return <div key={index}>{move.figure.color}</div>;
      })*/}
      <p className="dashboard-text">
        {props.checkmate
          ? invertColor(props.turn) + " wins!"
          : props.remis
          ? "It's a draw!"
          : "It's " + props.turn + "'s turn"}
      </p>
      <ResetBoard resetBoard={props.resetBoard} />
      <UndoButton
        handleUndo={props.handleUndo}
        moveHistory={props.moveHistory}
      />
    </div>
  );
};

export default Dashboard;
