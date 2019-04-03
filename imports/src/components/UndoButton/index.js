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
          <div>
            <div className="hourglass">
              <i className="fas fa-hourglass-half" />
            </div>
          </div>
          <div>
            <button
              className="btn btn-danger"
              onClick={() => props.revertUndoProposal()}
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>
      ) : (
        <div className="btn btn-info" onClick={() => props.proposeUndo()}>
          <i className="fas fa-undo" />
        </div>
      )}
    </div>
  ) : null;
};
export default UndoButton;
