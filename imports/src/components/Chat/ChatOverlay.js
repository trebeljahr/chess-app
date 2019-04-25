import React from "react";
class ChatOverlay extends React.Component {
  constructor(props) {
    super(props);
  }
  newMessage = e => {
    e.preventDefault();
    Meteor.call(
      "states.addNewMessage",
      {
        _id: this.props._id,
        message: {
          text: e.target.messageInput.value,
          user: Meteor.user().username
        }
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
  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  };

  componentDidMount = () => {
    this.scrollToBottom();
  };

  componentDidUpdate = () => {
    this.scrollToBottom();
  };
  render() {
    return (
      <div className="overlay">
        <ul>
          {this.props.messages.map((message, index) => {
            return (
              <li key={index}>
                <label>{message.user}: </label> {message.text}
              </li>
            );
          })}
          <div
            style={{ float: "left", clear: "both" }}
            ref={el => {
              this.messagesEnd = el;
            }}
          />
        </ul>
        <div className="toolbar">
          <form action="submit" onSubmit={this.newMessage}>
            <input
              className="messageInput"
              type="text"
              name="messageInput"
              placeholder="New Message"
            />
            <button type="submit" className="btn btn-success send">
              <i className="fas fa-paper-plane" />
            </button>
          </form>
          <div onClick={this.props.handleClick} className="btn btn-primary">
            Hide the chat!
          </div>
        </div>
        <style>{`
          .overlay {
            position: absolute;
            top: 0;
            left: 0;
            padding: 10px;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 2;
            display: grid;
            grid-template-areas: "messages messages" "toolbar toolbar";
            grid-template-rows: 9fr 1fr;
          }
          ul {
            list-style-type: none;
            grid-area: messages;
            margin: 0;
            padding: 0;
            max-height: 100%;
            overflow-y: scroll;
            text-align: left;
          }
          .toolbar {
            grid-area: toolbar;
            display:flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-around;
            padding-right: 10px;
          }

          form {
            width: 100%;
            display: flex;
            margin-right: 10px;
          }
          .messageInput {
            width: 100%;
          }
          .send {
            margin-left: 10px;
          }
          `}</style>
      </div>
    );
  }
}
export default ChatOverlay;
