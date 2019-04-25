import React from "react";
class AbandonGameButton extends React.Component {
  constructor(props) {
    super(props);
  }
  handleFirstAbandon = () => {
    console.log("First");
  };
  handleSecondAbandon = () => {
    console.log("Second");
  };
  render() {
    return (
      <div>
        {this.props.deleteGame && this.props.color !== "none" ? (
          this.props.deleteGame === this.props.color ? (
            <button onClick={this.handleSecondAbandon}>Abandon Game</button>
          ) : (
            <div>You already abandoned the game?</div>
          )
        ) : (
          <button onClick={this.handleFirstAbandon}>Abandon Game</button>
        )}
      </div>
    );
  }
}
export default AbandonGameButton;
