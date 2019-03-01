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
  handleDelete = _id => {
    Meteor.call("states.deleteById", { _id });
  };
  handleExtend = () => {
    this.setState(state => {
      return {
        extend: !state.extend
      };
    });
  };
  createNewGame = (e, color) => {
    e.preventDefault();
    let name = e.target.name.value;
    if (States.findOne({ name })) {
      Alert.error("A game with this name already exists!", {
        position: "top",
        effect: "genie"
      });
      //return;
    } else {
      Meteor.call("states.createNew", { name }, (err, res) => {
        if (err) {
          alert(err);
        } else {
          Alert.success("Success! You have created a new game!", {
            position: "top",
            effect: "genie"
          });
          console.log(res._id);
          window.location.href = "/games/" + res._id;
          //window.
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
                    <div className="submitButtonsContainer">
                      <input type="submit" name="play" value="White" />
                      <input type="submit" name="play" value="Random" />
                      <input type="submit" name="play" value="Black" />
                    </div>
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
                    <a
                      className="btn btn-success margin"
                      href={"/games/" + state._id}
                    >
                      Join
                    </a>
                    <button
                      className="btn btn-danger margin"
                      onClick={() => this.handleDelete(state._id)}
                    >
                      &times;
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
  let states = States.find({}).fetch();
  return { states };
})(Home);

export default HomeContainer;
