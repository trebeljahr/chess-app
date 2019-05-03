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
    const content = this.props.users.map((user, index) => {
      const connected = (
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
          `}</style>
        </i>
      );
      return (
        <div key={user.userId}>
          {index === 0 ? (
            <div>
              {connected}
              <p>{user.name}</p>
            </div>
          ) : (
            <div>
              <p>{"vs. " + user.name}</p>
              {connected}
            </div>
          )}

          <style jsx>{`
            div {
              display: flex;
              align-items: center;
            }
            p {
              margin: 5px;
            }
          `}</style>
        </div>
      );
    });
    return (
      <h2>
        {content}
        <style jsx>{`
          h2 {
            grid-area: g;
            font-weight: bold;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
          }
        `}</style>
      </h2>
    );
  }
}
export default WhoPlays;
