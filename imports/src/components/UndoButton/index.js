import React from "react";

const UndoButton = props => {
  return props.moveHistory.length >= 1 ? (
    <button onClick={() => props.handleUndo()}>⤾</button>
  ) : null;
};
export default UndoButton;
