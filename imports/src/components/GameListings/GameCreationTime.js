import React from "react";
class GameCreationTime extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      now: Math.floor((Date.now() - this.props.timestamp) / 60000),
      interval: false
    };
  }
  tick = () => {
    this.setState({
      now: Math.floor((Date.now() - this.props.timestamp) / 60000)
    });
  };
  componentDidMount = () => {
    this.setState({ interval: setInterval(this.tick, 60000) });
  };
  componentWillUnmount = () => {
    clearInterval(this.state.interval);
  };
  render() {
    return this.props.user ? (
      <p>
        {this.props.user.userId === Meteor.userId()
          ? "You "
          : this.props.user.name + " "}
        created this game {this.state.now} minutes ago
      </p>
    ) : (
      <div />
    );
  }
}
export default GameCreationTime;
