import React from "react";

import { States } from "../../../../imports/api/states.js";
import { withTracker } from "meteor/react-meteor-data";
import ChatOverlay from "./ChatOverlay.js";

class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false
    };
  }
  handleClick = () => {
    this.setState(state => {
      return {
        show: !state.show
      };
    });
  };

  render() {
    return this.state.show && this.props.messages ? (
      <ChatOverlay
        messages={this.props.messages}
        handleClick={this.handleClick}
      />
    ) : (
      <div>
        <button onClick={this.handleClick} className="btn btn-primary">
          <i className="fas fa-comments fa-2x" />
        </button>
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
