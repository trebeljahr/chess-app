import React from "react";
import { Meteor } from "meteor/meteor";
import { render } from "react-dom";
import ChessAppContainer from "../imports/frontend/src/App.js";

Meteor.startup(() => {
  render(<ChessAppContainer />, document.getElementById("root"));
});
