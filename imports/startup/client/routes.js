import React from "react";
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
