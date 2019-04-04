import React from "react";
import "./App.css";
import Board from "./components/Board";
import Dashboard from "./components/Dashboard";

import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";

class ChessApp extends React.Component {
  constructor(props) {
    super(props);
  }

  handleFirstClick = field => {
    if (this.props.game) {
      Meteor.call("states.handleFirstClick", {
        _id: this.props.game._id,
        field,
        userId: Meteor.userId()
      });
    }
  };
  handleSecondClick = field => {
    if (this.props.game) {
      Meteor.call("states.handleSecondClick", {
        _id: this.props.game._id,
        field,
        userId: Meteor.userId()
      });
    }
  };
  handleUndo = () => {
    if (this.props.game) {
      Meteor.call("states.handleUndo", {
        _id: this.props.game._id,
        userId: Meteor.userId()
      });
    }
  };
  proposeUndo = () => {
    if (this.props.game) {
      Meteor.call("states.proposeUndo", {
        _id: this.props.game._id,
        userId: Meteor.userId()
      });
    }
  };
  revertUndoProposal = () => {
    if (this.props.game) {
      Meteor.call("states.revertUndoProposal", {
        _id: this.props.id,
        userId: Meteor.userId()
      });
    }
  };

  continueTurn = figure => {
    if (this.props.game) {
      Meteor.call("states.handlePawnChange", {
        _id: this.props.game._id,
        figure,
        userId: Meteor.userId()
      });
    }
  };
  render() {
    if (this.props.game) {
      let color = this.props.game.users.find(
        user => user.userId === Meteor.userId()
      ).color;
      return (
        <div className="AppContainer">
          <p className="GameTitle">Game: {this.props.game.name}</p>
          <Board
            board={this.props.game.board}
            turnAround={color === "black" ? true : false}
            handleClick={
              this.props.game.movePart === 0
                ? this.handleFirstClick
                : this.handleSecondClick
            }
          />
          <div className="sidebar">
            {this.props.game.baseLinePawn && color === this.props.game.turn ? (
              <div className="grey">
                <span
                  onClick={() => this.continueTurn("knight")}
                  className={"fas fa-chess-knight " + color}
                />
                <span
                  onClick={() => this.continueTurn("bishop")}
                  className={"fas fa-chess-bishop " + color}
                />
                <span
                  onClick={() => this.continueTurn("rook")}
                  className={"fas fa-chess-rook " + color}
                />
                <span
                  onClick={() => this.continueTurn("queen")}
                  className={"fas fa-chess-queen " + color}
                />
              </div>
            ) : null}
            <Dashboard
              _id={this.props.game._id}
              checkmate={this.props.game.checkmate}
              remis={this.props.game.remis}
              turn={this.props.game.turn}
              color={color}
              revertUndoProposal={this.revertUndoProposal}
              proposeUndo={this.proposeUndo}
              handleUndo={this.handleUndo}
              offerTakeback={this.props.game.offerTakeback}
              moveHistory={this.props.game.moveHistory}
            />
          </div>
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}
const ChessAppContainer = withTracker(props => {
  const _id = props.match.params.id;
  const handle = Meteor.subscribe("states");
  const game = States.find({ _id }).fetch()[0];
  return {
    id: _id,
    game
  };
})(ChessApp);
export default ChessAppContainer;
