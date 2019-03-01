import React from "react";
import "./Chat.css";

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
    console.log(e.target.messageInput.value);
  };
  render() {
    return this.state.show ? (
      <div className="overlay">
        Hello there!
        <div className="toolbar">
          <form action="submit" onSubmit={this.newMessage}>
            <input type="text" name="messageInput" placeholder="New Message" />
            <input type="submit" className="btn btn-success" />
          </form>

          <button onClick={this.handleClick} className="btn btn-primary">
            Hide the chat!
          </button>
        </div>
      </div>
    ) : (
      <button onClick={this.handleClick} className="btn btn-primary">
        Show the chat!
      </button>
    );
  }
}
export default Chat;
