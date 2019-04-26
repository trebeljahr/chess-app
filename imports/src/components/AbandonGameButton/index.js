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
            <div onClick={this.handleSecondAbandon}>
              <i className="fas fa-door-open fa-2x" />
            </div>
          ) : (
            <div>You already abandoned the game?</div>
          )
        ) : (
          <div onClick={this.handleFirstAbandon}>
            <i className="fas fa-door-open fa-2x" />
          </div>
        )}
        <style jsx>{`
          div {
            color: black;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #d9dcd6;
          }
        `}</style>
      </div>
    );
  }
}
export default AbandonGameButton;
