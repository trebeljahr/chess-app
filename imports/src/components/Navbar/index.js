import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Template } from "meteor/templating";
import { Blaze } from "meteor/blaze";

export default class Navbar extends Component {
  componentDidMount() {
    this.navbar = Blaze.render(
      Template.atNavButton,
      ReactDOM.findDOMNode(this.refs.navbar)
    );
  }
  componentWillUnmount() {
    Blaze.remove(this.navbar);
  }
  render() {
    return (
      <div ref="navbar">
        <style jsx>{`
          div {
            position: fixed;
            top: 0;
            z-index: 3;
            width: 100%;
            padding-left: 10px;
            display: flex;
            justify-content: flex-start;
            background: blue;
          }
        `}</style>
      </div>
    );
  }
}
