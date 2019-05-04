import React from "react";
class ChatOverlay extends React.Component {
  constructor(props) {
    super(props);
    this.state = { messages: [] };
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
    if (this.props.messages.length !== this.state.messages.length) {
      this.scrollToBottom();
      this.setState({ messages: this.props.messages });
    }
  };
  render() {
    return (
      <div className="overlay">
        <div className="header">
          <h3>Chat</h3>
        </div>
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
            <button id="yellow" type="submit" className="btn btn-success send">
              <i className="fas fa-paper-plane" />
            </button>
          </form>
          <div
            id="blue"
            onClick={this.props.handleClick}
            className="btn btn-primary"
          >
            <i className="fas fa-chevron-up" />
          </div>
        </div>
        <style>{`
          .header {
            height: auto;
            padding: 10px;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #C0D6DF;
          }
          #blue {
            background: #258ea6;
          }
          #yellow {
            background: #EFA00B;
          }
          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: white;
            z-index: 2;
            overflow: hidden;
          }
          ul {
            list-style-type: none;
            height: 80vh;
            max-height: 100%;
            margin: 0;
            padding: 0;
            padding-left: 20px;
            overflow-y: scroll;
            text-align: left;
            scrollbar-color: #286090 #FFF;
          }
          ul::-webkit-scrollbar {
              width: 15px;
              }
          ul::-webkit-scrollbar-track-piece  {
              background: white;
          }

          ul::-webkit-scrollbar-thumb:vertical {
              background: #286090;
          }
          .toolbar {
            display: flex;
            height: auto;
            flex-direction: row;
            align-items: center;
            justify-content: space-around;
            padding: 10px;
            padding-left: 20px;
            background: #C0D6DF;
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
