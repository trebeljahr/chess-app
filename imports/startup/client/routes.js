import React from "react";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";
// route components
import ChessAppContainer from "../../src/App.js";
import HomeContainer from "../../src/Home.js";

const renderRoutes = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={HomeContainer} />
      <Route exact path="/games/:id" component={ChessAppContainer} />
    </Switch>
  </Router>
);

export { renderRoutes };
