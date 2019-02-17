import React from "react";
const ResetBoard = props => {
  return <button onClick={() => props.resetBoard()}>Reset!</button>;
};
export default ResetBoard;
