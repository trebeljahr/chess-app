import React from "react";
import { Meteor } from "meteor/meteor";
import { render } from "react-dom";
import ChessApp from "../imports/frontend/src/App.js";

Meteor.startup(() => {
  render(<ChessApp />, document.getElementById("root"));
});
