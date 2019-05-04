import React from "react";
import { invertColor } from "../../helpers/invertColor.js";

const UndoButton = props => (
  <div style={{ gridArea: "d" }}>
    {props.color !== "none" && !props.deleteGame ? (
      <div>
        {props.offerTakeback === invertColor(props.color) ? (
          <div>
            <button
              className="btn btn-danger"
              onClick={() => props.revertUndoProposal()}
            >
              <i className="fas fa-ban fa-2x" />
            </button>
            <button className="btn btn-info" onClick={() => props.handleUndo()}>
              <i className="fas fa-check fa-2x" />
            </button>
          </div>
        ) : props.offerTakeback ? (
          <div>
            <button className="noClick btn btn-warning">
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
          <button id="undo" className="btn" onClick={() => props.proposeUndo()}>
            <i className="fas fa-undo fa-2x" />
          </button>
        )}
      </div>
    ) : null}
    <style jsx>{`
      #undo {
        background: #d9dcd6;
        border: none;
      }
      #undo:hover {
        background: #c6c8c3;
      }
      .noClick {
        pointer-events: none;
      }
      button {
        margin: 0 5px;
      }
    `}</style>
  </div>
);

export default UndoButton;
