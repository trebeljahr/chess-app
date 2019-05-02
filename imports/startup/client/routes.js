import React from "react";
import { FlowRouter } from "meteor/kadira:flow-router";
import { mount } from "react-mounter";

import ChessAppContainer from "../../src/App.js";
import HomeContainer from "../../src/Home.js";
import Login from "../../src/components/Login";

const Router = props => {
  return <div>{props.content}</div>;
};
function checkLoggedIn(ctx, redirect) {
  if (!Meteor.userId()) {
    redirect("/login");
  }
}

function redirectIfLoggedIn(ctx, redirect) {
  if (Meteor.userId()) {
    redirect("/");
  }
}

var privateRoutes = FlowRouter.group({
  name: "private",
  triggersEnter: [checkLoggedIn]
});

privateRoutes.route("/", {
  name: "Home",
  action(params, queryParams) {
    mount(Router, {
      content: <HomeContainer />
    });
  }
});
FlowRouter.route("/login", {
  name: "Login",
  action() {
    mount(Router, {
      content: <Login />
    });
  }
});
privateRoutes.route("/games/", {
  name: "Games",
  action(params, queryParams) {
    mount(Router, {
      content: <ChessAppContainer />
    });
  }
});

export default Router;

/*import React from "react";
import {
  Route,
  Switch,
  Redirect,
  BrowserRouter as Router
} from "react-router-dom";
// route components
import ChessAppContainer from "../../src/App.js";
import HomeContainer from "../../src/Home.js";
import Navbar from "../../src/components/Navbar";
import Login from "../../src/components/Login";

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      Meteor.userId() ? <Component {...props} /> : <Redirect to="/login/" />
    }
  />
);

const renderRoutes = () => (
  <Router>
    <Switch>
      <Route exact path="/games/" component={ChessAppContainer} />
      <Route exact path="/login/" component={Login} />
      <PrivateRoute component={HomeContainer} />
    </Switch>
  </Router>
);

export { renderRoutes };
*/
