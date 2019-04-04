import React from "react";
import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";
import "./Home.css";
import Alert from "react-s-alert";
import "react-s-alert/dist/s-alert-default.css";
import "react-s-alert/dist/s-alert-css-effects/genie.css";

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      extend: false
    };
  }
  handleExtend = () => {
    this.setState(state => {
      return {
        extend: !state.extend
      };
    });
  };
  handleJoin = _id => {
    const game = States.findOne({ _id });
    if (!Meteor.userId()) {
      return Alert.error("Please log in to join or spectate a game", {
        position: "top",
        effect: "genie"
      });
    }
    if (game.users.filter(u => u.userId === Meteor.userId()).length > 0) {
      return (window.location.href = "/games/" + _id);
    }
    let color =
      game.users.length >= 2
        ? "none"
        : game.users[0].color === "white"
        ? "black"
        : "white";
    Meteor.call(
      "states.userEntersGame",
      {
        _id,
        user: { userId: Meteor.userId(), color, name: Meteor.user().username }
      },
      (err, res) => {
        if (err) {
          alert(err);
        } else {
          window.location.href = "/games/" + _id;
        }
      }
    );
  };
  createNewGame = e => {
    e.preventDefault();
    let color = e.target.color.value;
    let name = e.target.name.value;
    if (name === "") {
      return Alert.error("Please enter a name for your game!", {
        position: "top",
        effect: "genie"
      });
    }
    if (!Meteor.userId()) {
      return Alert.error("Please login to create a game!", {
        position: "top",
        effect: "genie"
      });
    }
    if (States.findOne({ name })) {
      Alert.error("A game with this name already exists!", {
        position: "top",
        effect: "genie"
      });
    } else {
      Meteor.call("states.createNew", { name }, (err, res) => {
        if (err) {
          alert(err);
        } else {
          Meteor.call(
            "states.userEntersGame",
            {
              _id: res._id,
              user: {
                userId: Meteor.userId(),
                color,
                name: Meteor.user().username
              }
            },
            (err, response) => {
              if (err) {
                alert(err);
              } else {
                window.location.href = "/games/" + res._id;
              }
            }
          );
        }
      });
      States.findOne({ name });
      e.target.name.value = "";
    }
  };
  render() {
    return (
      <div>
        {this.props.states ? (
          <div className="centerFlex">
            {this.state.extend ? (
              <div className="fullScreen">
                <div
                  className="fullScreen opaque"
                  onClick={this.handleExtend}
                />
                <div className="formContainer">
                  <h2>Create a new game</h2>
                  <form
                    onSubmit={this.createNewGame}
                    className="createGameForm"
                  >
                    <input
                      className="formInput"
                      type="text"
                      name="name"
                      placeholder="Name"
                    />
                    <h4>Play as</h4>
                    <label htmlFor="white">White</label>
                    <input id="white" type="radio" name="color" value="white" />
                    {/*<label htmlFor="random">Random</label>
                    <input
                      id="random"
                      type="radio"
                      name="color"
                      value="random"
                    />*/}
                    <label htmlFor="black">Black</label>
                    <input id="black" type="radio" name="color" value="black" />
                    <input type="submit" value="Create Game!" />
                  </form>
                </div>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={this.handleExtend}>
                +
              </button>
            )}
            <h2>Join a game of chess!</h2>
            <div className="game-postings-container">
              {this.props.states.map(state => (
                <div key={state._id} className="game-posting">
                  <h3 className="game-posting-title">{state.name}</h3>
                  <div className="game-posting-controls">
                    <button
                      className="btn btn-success margin"
                      onClick={() => this.handleJoin(state._id)}
                    >
                      {state.users.filter(u => u.userId === Meteor.userId())
                        .length > 0
                        ? "Join again"
                        : state.users.length < 2
                        ? "Join"
                        : "Spectate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
        <Alert stack={{ limit: 1 }} timeout={3000} />
      </div>
    );
  }
}
const HomeContainer = withTracker(({}) => {
  let handle = Meteor.subscribe("states");
  let states = States.find({}).fetch();
  return { states };
})(Home);

export default HomeContainer;
