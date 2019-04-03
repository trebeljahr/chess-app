import React from "react";
import "./Chat.css";

import { States } from "../../../../imports/api/states.js";
import { withTracker } from "meteor/react-meteor-data";

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
  newMessage = e => {
    e.preventDefault();
    Meteor.call(
      "states.addNewMessage",
      {
        _id: this.props._id,
        messages: [
          ...this.props.messages,
          {
            text: e.target.messageInput.value,
            user: Meteor.user().username
          }
        ]
      },
      (err, res) => {
        if (err) {
          alert(err);
        } else {
        }
      }
    );
    e.target.messageInput.value = "";
  };
  render() {
    return this.state.show && this.props.messages ? (
      <div className="overlay">
        <ul className="messageDisplay">
          {this.props.messages.map((message, index) => {
            return (
              <li key={index}>
                <label>{message.user}: </label> {message.text}
              </li>
            );
          })}
        </ul>
        <div className="toolbar">
          <form
            className="messageForm"
            action="submit"
            onSubmit={this.newMessage}
          >
            <input
              className="messageInput"
              type="text"
              name="messageInput"
              placeholder="New Message"
            />
            <input type="submit" value="➤" className="btn btn-success" />
          </form>
          <div onClick={this.handleClick} className="btn btn-primary">
            Hide the chat!
          </div>
        </div>
      </div>
    ) : (
      <div>
        <div onClick={this.handleClick} className="btn btn-primary">
          <i className="fas fa-comments" />
        </div>
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
