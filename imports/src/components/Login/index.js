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
  }
  componentWillUnmount() {
    Blaze.remove(this.view);
  }
  render() {
    return (
      <div>
        <div className="banner">
          <h1>Nrin's Chess</h1>
          <h2>Play chess against your friends!</h2>
        </div>
        <div ref="container" className="login" />
        <style jsx>{`
          .login {
            position: fixed;
            top: 0;
            right: 0;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40vw;
            padding: 5vmin;
            height: 100vh;
            background: white;
            overflow: scroll;
            scrollbar-color: #286090 #fff;
          }
          .login::-webkit-scrollbar {
            width: 15px;
          }
          .login::-webkit-scrollbar-track-piece {
            background: white;
          }

          .login::-webkit-scrollbar-thumb:vertical {
            background: #286090;
          }
          .banner {
            color: white;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 2;
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
          @media only screen and (max-width: 600px) {
            .banner {
              width: 100vw;
              height: 30vh;
            }
            .login {
              top: 30vh;
              left: 0;
              width: 100vw;
              height: 70vh;
            }
          }
        `}</style>
      </div>
    );
  }
}
