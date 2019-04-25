import React from "react";
import { invertColor } from "../../helpers/invertColor.js";
class AbandonGameButton extends React.Component {
  constructor(props) {
    super(props);
  }
  handleFirstAbandon = () => {
    Meteor.call(
      "states.firstStepDeleteGame",
      {
        _id: this.props._id
      },
      (err, data) => {
        window.location.href = "/";
      }
    );
  };
  handleSecondAbandon = () => {
    Meteor.call(
      "states.secondStepDeleteGame",
      {
        _id: this.props._id
      },
      (err, data) => {
        window.location.href = "/";
      }
    );
  };
  render() {
    return (
      <div style={{ gridArea: "d" }}>
        {this.props.deleteGame && this.props.color !== "none" ? (
          this.props.deleteGame === invertColor(this.props.color) ? (
            <button onClick={this.handleSecondAbandon}>Abandon Game</button>
          ) : (
            <div>You already abandoned the game?</div>
          )
        ) : (
          <button onClick={this.handleFirstAbandon}>Abandon Game</button>
        )}
        <style jsx>{``}</style>
      </div>
    );
  }
}
export default AbandonGameButton;
