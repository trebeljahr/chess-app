import React from "react";

const UndoButton = props => {
  return props.moveHistory.length >= 1 && props.color != "spectating" ? (
    <div>
      {props.offerTakeback ? (
        <button className="btn btn-warning" onClick={() => props.handleUndo()}>
          Confirm Undo!
        </button>
      ) : (
        <button onClick={() => props.proposeUndo()}>⤾</button>
      )}
    </div>
  ) : null;
};
export default UndoButton;
