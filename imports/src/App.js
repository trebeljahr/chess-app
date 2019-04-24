import React from "react";
import "./App.css";
import Board from "./components/Board";
import Dashboard from "./components/Dashboard";
import PawnChangeInterface from "./components/PawnChangeInterface";
import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";
import Title from "./components/Title";

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
      let game = this.props.game;
      let color = game.users.find(user => user.userId === Meteor.userId())
        .color;
      return (
        <div className="AppContainer">
          <div className="full" />
          <Title name={game.name} />
          <Board
            board={game.board}
            turnAround={color === "black" ? true : false}
            handleClick={
              game.movePart === 0
                ? this.handleFirstClick
                : this.handleSecondClick
            }
          />
          <PawnChangeInterface
            baseLinePawn={game.baseLinePawn}
            turn={game.turn}
            color={color}
            continueTurn={this.continueTurn}
          />
          <Dashboard
            _id={game._id}
            checkmate={game.checkmate}
            remis={game.remis}
            turn={game.turn}
            color={color}
            revertUndoProposal={this.revertUndoProposal}
            proposeUndo={this.proposeUndo}
            handleUndo={this.handleUndo}
            offerTakeback={game.offerTakeback}
            moveHistory={game.moveHistory}
          />
          <style jsx>{`
            .full {
              background: blue;
              position: absolute;
              top: 0;
              left: 0;
              height: 100%;
              width: 100%;
              z-index: 100;
            }
          `}</style>
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
