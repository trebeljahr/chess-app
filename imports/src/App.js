import React from "react";
import Board from "./components/Board";
import Dashboard from "./components/Dashboard";
import PawnChangeInterface from "./components/PawnChangeInterface";
import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";
import YAxis from "./components/YAxis";
import XAxis from "./components/XAxis";
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
    if (this.props.game && this.props.game.moveHistory.length > 0) {
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
  /*componentWillUnmount(){
    Meteor.call(
      "states.handleClientDisconnect",
      {
        _id: this.props.game._id
      },
      err => {
        if (err) {
          console.error(err);
        }
      }
    );
  };*/
  render() {
    if (this.props.game) {
      let game = this.props.game;
      let color = game.users.find(user => user.userId === Meteor.userId())
        .color;
      return (
        <div className="main">
          <div className="game">
            <Board
              board={game.board}
              turnAround={color === "black" ? true : false}
              handleClick={
                game.movePart === 0
                  ? this.handleFirstClick
                  : this.handleSecondClick
              }
            />
            <XAxis turnAround={color === "black" ? true : false} />
            <YAxis turnAround={color === "black" ? true : false} />
            <PawnChangeInterface
              baseLinePawn={game.baseLinePawn}
              turn={game.turn}
              color={color}
              continueTurn={this.continueTurn}
            />
          </div>

          <Dashboard
            name={game.name}
            users={game.users}
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
          <style jsx>{`
            .main {
              position: absolute;
              top: 0;
              left: 0;
              height: 100vh;
              width: 100vw;
              text-align: center;
              overflow-x: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .game {
              position: relative;
              padding: 5vmin;
              margin: 5vmin;
            }
            @media (orientation: portrait) {
              .game {
                display: flex;
                align-items: flex-start;
                justify-content: flex-start;
                padding: 0;
                margin: 0;
              }
            }
            @media only screen and (min-aspect-ratio: 7/5) {
              .game {
                display: flex;
                grid-area: b;
                position: relative;
              }
              .main {
                flex-direction: row;
              }
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
  const { name } = queryString.parse(props.location.search);
  const handle = Meteor.subscribe("states");
  const game = States.findOne({ name });
  return {
    game
  };
})(ChessApp);
export default ChessAppContainer;
