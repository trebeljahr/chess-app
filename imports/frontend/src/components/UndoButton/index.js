import React from "react";

const UndoButton = props => {
  return props.moveHistory.length >= 1 ? (
    <button onClick={() => props.handleUndo()}>Undo!</button>
  ) : null;
};
export default UndoButton;
