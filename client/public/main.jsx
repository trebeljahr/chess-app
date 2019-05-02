import React from "react";
import { Meteor } from "meteor/meteor";
import { render } from "react-dom";
import "../../lib/accounts-config.js";

import Router from "../../imports/startup/client/routes.js";

Meteor.startup(() => {
  render(<Router />, document.getElementById("root"));
});
