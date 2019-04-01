import React from "react";
import { invertColor } from "../../helpers/invertColor.js";

const UndoButton = props => {
  return props.moveHistory.length >= 1 ? (
    <div>
      {props.offerTakeback === invertColor(props.color) ? (
        <button className="btn btn-warning" onClick={() => props.handleUndo()}>
          Confirm Undo?
        </button>
      ) : props.offerTakeback ? (
        <p className="WaitingText">Awaiting confirmation...</p>
      ) : (
        <button onClick={() => props.proposeUndo()}>⤾</button>
      )}
    </div>
  ) : null;
};
export default UndoButton;
