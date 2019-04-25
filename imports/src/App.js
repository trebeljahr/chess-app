import React from "react";
import Board from "./components/Board";
import Dashboard from "./components/Dashboard";
import PawnChangeInterface from "./components/PawnChangeInterface";
import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";
import Title from "./components/Title";
import queryString from "query-string";

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
        _id: this.props.game._id,
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
        <div>
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
            offerTakeback={game.offerTakeback}
            moveHistory={game.moveHistory}
            deleteGame={game.deleteGame}
            color={color}
            revertUndoProposal={this.revertUndoProposal}
            proposeUndo={this.proposeUndo}
            handleUndo={this.handleUndo}
          />
          <style jsx>{``}</style>
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}
const ChessAppContainer = withTracker(props => {
  //const name = props.match.params.name;
  const { name } = queryString.parse(props.location.search);
  const handle = Meteor.subscribe("states");
  const game = States.findOne({ name }); //.fetch()[0];
  return {
    game
  };
})(ChessApp);
export default ChessAppContainer;
