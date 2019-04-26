import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Template } from "meteor/templating";
import { Blaze } from "meteor/blaze";

export default class Navbar extends Component {
  componentDidMount() {
    this.view = Blaze.render(
      Template.atForm,
      ReactDOM.findDOMNode(this.refs.container)
    );
    this.navbar = Blaze.render(
      Template.atNavButton,
      ReactDOM.findDOMNode(this.refs.navbar)
    );
  }
  componentWillUnmount() {
    Blaze.remove(this.view);
    Blaze.remove(this.navbar);
  }
  render() {
    return (
      <div>
        <div
          ref="navbar"
          onClick={this.handleClick}
          className={
            AccountsTemplates.getState() !== "hide" ? "hidden" : "atTop"
          }
        />
        <div ref="container" />
        <style jsx>{`
          div{
            background: white;
          }
          .atTop {
            position: fixed;
            top: 0;
            z-index: 3;
            width: 100%;
            padding-left: 10px;
            display: flex;
            justify-content: flex-start;
            background: blue;
          }
          .hidden {
            display: none;
          }
          }
        `}</style>
      </div>
    );
  }
}
