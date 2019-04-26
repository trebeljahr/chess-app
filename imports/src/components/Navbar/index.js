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
      <div id="nav">
        {Meteor.user() ? <h4>Signed in as: {Meteor.user().username}</h4> : null}
        <div ref="navbar" />
        <style jsx>{`
          #nav {
            position: relative;
            padding: 5px;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #246EB9;
            );
          }
          h4 {
            padding: 0;
            margin: 0;
            margin-right: 20px;
            color: white;
          }
        `}</style>
      </div>
    );
  }
}
