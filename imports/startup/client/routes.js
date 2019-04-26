import React from "react";
import { Route, BrowserRouter as Router } from "react-router-dom";
// route components
import ChessAppContainer from "../../src/App.js";
import HomeContainer from "../../src/Home.js";
import Navbar from "../../src/components/Navbar";
import Login from "../../src/components/Login";

const renderRoutes = () => (
  <Router>
    <div>
      <Switch>
        <Route exact path="/games/" component={ChessAppContainer} />
        <Route exact path="/login/" component={Login} />
        <Route component={Navbar} />
        <Route component={HomeContainer} />
      </Switch>
    </div>
  </Router>
);

export { renderRoutes };
