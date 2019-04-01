import React from "react";
import { invertColor } from "../../helpers/invertColor.js";

const UndoButton = props => {
  return props.moveHistory.length >= 1 && props.color != "spectating" ? (
    <div>
      {props.offerTakeback === invertColor(props.color) ? (
        <button className="btn btn-warning" onClick={() => props.handleUndo()}>
          Confirm Undo?
        </button>
      ) : props.offerTakeback ? (
        <div className="undoProposal">
          <p className="WaitingText">Waiting...</p>
          <button
            className="btn btn-danger"
            onClick={() => props.revertUndoProposal()}
          >
            &times;
          </button>
        </div>
      ) : (
        <button onClick={() => props.proposeUndo()}>⤾</button>
      )}
    </div>
  ) : null;
};
export default UndoButton;
