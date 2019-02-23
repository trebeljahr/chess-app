import React from "react";
import { Meteor } from "meteor/meteor";
import { render } from "react-dom";
import ChessAppContainer from "../../imports/src/App.js";
import HomeContainer from "../../imports/src/Home.js";

Meteor.startup(() => {
  render(<HomeContainer />, document.getElementById("root"));
});
