import React from "react";

import { States } from "../../../../imports/api/states.js";
import { withTracker } from "meteor/react-meteor-data";
import ChatOverlay from "./ChatOverlay.js";

class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      numberOfMessages: this.props.messages.length
    };
  }
  handleClick = () => {
    this.setState(state => {
      return {
        show: !state.show,
        numberOfMessages: this.props.messages.length
      };
    });
  };

  render() {
    let numberOfNewMessages =
      this.props.messages.length - this.state.numberOfMessages;
    return this.state.show && this.props.messages ? (
      <ChatOverlay
        messages={this.props.messages}
        handleClick={this.handleClick}
        _id={this.props._id}
      />
    ) : (
      <div>
        <button onClick={this.handleClick} className="btn btn-primary">
          <i className="fas fa-comments fa-2x" />
        </button>
        {numberOfNewMessages > 0 ? (
          <div className="align">
            <div className="newMessages">{numberOfNewMessages}</div>
          </div>
        ) : null}
        <style jsx>{`
          div {
            position: relative;
            grid-area: e;
            justify-self: end;
          }
          button {
            background: #258ea6;
            border: none;
          }
          .align {
            position: absolute;
            bottom: 4px;
            right: 5px;
            display: flex;
            flex-wrap: no-wrap;
            width: 100%;
            height: 100%;
            pointer-events: none;
            justify-content: center;
            align-items: center;
          }
          .newMessages {
            color: black;
          }
        `}</style>
      </div>
    );
  }
}
const ChatContainer = withTracker(props => {
  let handle = Meteor.subscribe("states");
  let game = States.find({ _id: props._id }).fetch()[0];
  let messages = game.messages;
  return { messages };
})(Chat);
export default ChatContainer;
