import React from "react";

class WhoPlays extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount = () => {
    Meteor.call("states.updateUserTimeStamp", { _id: this.props._id });
    this.setState({
      interval: setInterval(this.refreshConnectionStatus, 1000)
    });
  };
  refreshConnectionStatus = () => {
    Meteor.call("states.updateUserTimeStamp", { _id: this.props._id });
  };
  componentWillUnmount = () => {
    clearInterval(this.state.interval);
  };
  render() {
    const connected = user => (
      <i
        className={
          "fas fa-circle " +
          (Date.now() - user.timeStamp < 2000 ? "online" : "offline")
        }
      >
        <style jsx>{`
          .online {
            color: #28c958d2;
          }
          .offline {
            color: #d9534f;
          }
          i {
            margin: 0 5px;
          }
        `}</style>
      </i>
    );
    const userElement = (user, index) => (
      <div key={user.userId}>
        {index === 0 ? connected(user) : ""}
        {user.name}
        {index === 1 ? connected(user) : ""}
        <style jsx>{`
          div {
            display: flex;
            margin: 5px;
          }
        `}</style>
      </div>
    );

    return (
      <h2>
        {this.props.users[1] ? (
          <div>
            {userElement(this.props.users[0], 0)}
            <div>vs.</div>
            {userElement(this.props.users[1], 1)}
          </div>
        ) : (
          "Waiting for opponent..."
        )}
        <style jsx>{`
          h2 {
            grid-area: g;
            font-weight: bold;
            margin: 0;
            padding: 0;
            display: flex;
            width: 100%;
            justify-content: center;
          }
          div {
            margin-top: 5px;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
          }
        `}</style>
      </h2>
    );
  }
}
export default WhoPlays;
