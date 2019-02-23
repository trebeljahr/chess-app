import React from "react";
import { withTracker } from "meteor/react-meteor-data";
import { States } from "../../imports/api/states.js";
import "./Home.css";

class Home extends React.Component {
  constructor(props) {
    super(props);
  }
  handleDelete = _id => {
    console.log(_id);
    Meteor.call("states.deleteById", { _id });
  };
  createNewGame = e => {
    e.preventDefault();
    let name = e.target.name.value;
    console.log(name);

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
          <div>
            <form onSubmit={this.createNewGame}>
              <input type="text" name="name" placeholder="Name your game" />
              <input type="submit" />
            </form>
            {this.props.states.map(state => (
              <div key={state._id} className="gameContainer">
                <h3>{state.name}</h3>
                <a className="linkButton" href="https://www.google.com">
                  Join
                </a>
                <button
                  className="deleteButton"
                  onClick={() => this.handleDelete(state._id)}
                >
                  Delete!
                </button>
              </div>
            ))}
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
