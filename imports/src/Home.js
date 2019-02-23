import React from "react";
import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";
import "./Home.css";

class Home extends React.Component {
  constructor(props) {
    super(props);
  }
  handleDelete = _id => {
    Meteor.call("states.deleteById", { _id });
  };
  createNewGame = e => {
    e.preventDefault();
    let name = e.target.name.value;
    if (States.findOne({ name })) {
      alert("A game with this name already exists!");
      return;
    }
    Meteor.call("states.createNew", { name });
    e.target.name.value = "";
  };
  render() {
    return (
      <div>
        {this.props.states ? (
          <div className="centerFlex">
            Create a game
            <form onSubmit={this.createNewGame}>
              <input type="text" name="name" placeholder="Name" />
              <input type="submit" />
            </form>
            <h2>Join a game</h2>
            <div className="game-postings-container">
              {this.props.states.map(state => (
                <div key={state._id} className="game-posting">
                  <h3 className="game-posting-title">{state.name}</h3>
                  <div className="game-posting-controls">
                    <a className="linkButton" href={"/games/" + state._id}>
                      Join
                    </a>
                    <button
                      className="deleteButton"
                      onClick={() => this.handleDelete(state._id)}
                    >
                      Delete!
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    );
  }
}
const HomeContainer = withTracker(({}) => {
  let states = States.find({}).fetch();
  return { states };
})(Home);

export default HomeContainer;
