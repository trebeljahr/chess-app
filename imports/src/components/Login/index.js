import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Template } from "meteor/templating";
import { Blaze } from "meteor/blaze";

export default class Login extends React.Component {
  componentDidMount() {
    this.view = Blaze.render(
      Template.atForm,
      ReactDOM.findDOMNode(this.refs.container)
    );
  }
  componentWillUnmount() {
    Blaze.remove(this.view);
  }
  render() {
    return (
      <div className="flex">
        <div className="banner">
          <h1>Nrin's Chess</h1>
          <h2>Play chess against your friends!</h2>
        </div>
        <div ref="container" className="login" />
        <style jsx>{`
          .flex {
            display: flex;
          }
          .login {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 40vw;
            padding: 5vmin;
            height: 100vh;
            background: white;
            overflow: scroll;
          }
          .banner {
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            width: 60vw;
            height: 100vh;
            background: linear-gradient(
              111.45349766483548deg,
              rgba(2, 27, 62, 1) 5.73779698099772%,
              rgba(81, 119, 149, 1) 96.25816012540469%
            );
          }
          h1 {
            font-weight: bold;
          }
          @media only screen and (max-width: 600px) and (max-height: 500px) {
            h2 {
              display: none;
            }
          }
          @media only screen and (max-width: 600px) {
            .banner {
              width: 100%;
              height: 30vh;
            }
            .flex {
              flex-direction: column;
            }
            .login {
              width: 100%;
              height: auto;
            }
          }
        `}</style>
      </div>
    );
  }
}
