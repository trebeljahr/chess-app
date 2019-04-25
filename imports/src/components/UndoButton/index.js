import React from "react";
import { invertColor } from "../../helpers/invertColor.js";

const UndoButton = props => (
  <div style={{ gridArea: "d" }}>
    {props.moveHistory.length >= 1 &&
    props.color !== "none" &&
    !props.deleteGame ? (
      <div>
        {props.offerTakeback === invertColor(props.color) ? (
          <button
            className="btn btn-warning"
            onClick={() => props.handleUndo()}
          >
            Confirm Undo?
          </button>
        ) : props.offerTakeback ? (
          <div>
            <button className="hourglass btn btn-warning">
              <i className="fas fa-hourglass-half fa-2x" />
            </button>
            <button
              className="btn btn-danger"
              onClick={() => props.revertUndoProposal()}
            >
              <i className="fas fa-times fa-2x" />
            </button>
          </div>
        ) : (
          <button className="btn btn-info" onClick={() => props.proposeUndo()}>
            <i className="fas fa-undo fa-2x" />
          </button>
        )}
      </div>
    ) : null}
    <style jsx>{`
      .hourglass {
        pointer-events: none;
      }
    `}</style>
  </div>
);

export default UndoButton;
