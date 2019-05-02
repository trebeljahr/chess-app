import React from "react";
import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";
import Alert from "react-s-alert";
import NewGameForm from "./components/NewGameForm";
import GameListings from "./components/GameListings";
import Navbar from "./components/Navbar";

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
      FlowRouter.go("Games");
      FlowRouter.setQueryParams({ name: game.name });
      return;
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
        color
      },
      (err, res) => {
        if (err) {
          alert(err);
        } else {
          FlowRouter.go("Games");
          FlowRouter.setQueryParams({ name: game.name });
        }
      }
    );
  };
  createNewGame = e => {
    e.preventDefault();
    let color;
    if (e.target.color.value === "random") {
      color = Math.floor(Math.random() * 2) === 1 ? "white" : "black";
    } else {
      color = e.target.color.value;
    }
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
          if (res) {
            Meteor.call(
              "states.userEntersGame",
              {
                _id: res._id,
                color
              },
              (err, response) => {
                if (err) {
                  alert(err);
                } else {
                  FlowRouter.go("Games");
                  FlowRouter.setQueryParams({ name: res.name });
                }
              }
            );
          } else {
            Alert.error(
              "You can not create more than 200 games! Please delete some...",
              {
                position: "top",
                effect: "genie"
              }
            );
          }
        }
      });
      States.findOne({ name });
      e.target.name.value = "";
    }
  };
  handleDelete = _id => {
    Meteor.call("states.deleteEmptyGame", { _id });
  };
  render() {
    return (
      <div className="flex">
        <Navbar />
        {this.props.states ? (
          <div>
            <NewGameForm
              extend={this.state.extend}
              handleExtend={this.handleExtend}
              createNewGame={this.createNewGame}
            />
            <GameListings
              games={this.props.states}
              handleJoin={this.handleJoin}
              handleDelete={this.handleDelete}
            />
          </div>
        ) : (
          <div>Loading...</div>
        )}
        <Alert stack={{ limit: 1 }} timeout={3000} />
        <style jsx>{`
          .flex {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: white;
            display: flex;
            flex-direction: column;
          }
        `}</style>
      </div>
    );
  }
}
const HomeContainer = withTracker(({}) => {
  let handle = Meteor.subscribe("states");
  let userHandle = Meteor.subscribe("userData");
  let states = States.find({}).fetch();
  return { states };
})(Home);

export default HomeContainer;
