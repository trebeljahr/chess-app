import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Template } from "meteor/templating";
import { Blaze } from "meteor/blaze";

export default class Navbar extends Component {
  componentDidMount() {
    this.view = Blaze.render(
      Template.loginButtons,
      ReactDOM.findDOMNode(this.refs.container)
    );
  }
  componentWillUnmount() {
    Blaze.remove(this.view);
  }
  render() {
    return (
      <div className="Navbar">
        <div ref="container" className="login" />
        <style jsx>{`
          .Navbar {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            padding-left: 2%;
            padding-top: 1%;
            z-index: 4;
            position: fixed;
            top: 0;
            left: 0;
            padding-bottom: 1%;
            width: 100vw;
            background: navy;
            color: white;
          }
          .login {
            color: white;
            text-decoration: none;
          }
        `}</style>
      </div>
    );
  }
}
