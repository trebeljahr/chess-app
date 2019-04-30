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
    let mins = this.state.now;
    let hours = Math.floor(this.state.now / 60);
    let days = Math.floor(hours / 24);
    let weeks = Math.floor(days / 7);
    let months = Math.floor(weeks / 4);
    let years = Math.floor(months / 12);
    let out = years || months || weeks || days || hours || mins;
    let outText =
      (years
        ? "year"
        : months
        ? "month"
        : weeks
        ? "week"
        : days
        ? "day"
        : hours
        ? "hour"
        : mins
        ? "minute"
        : "") + (out > 1 ? "s" : "");
    console.log(out, outText);
    return this.props.user ? (
      <p>
        {this.props.user.userId === Meteor.userId()
          ? "You "
          : this.props.user.name + " "}
        created this game {out + " " + outText} ago
      </p>
    ) : (
      <div />
    );
  }
}
export default GameCreationTime;
