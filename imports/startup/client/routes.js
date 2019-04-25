import React from "react";
import { Route, BrowserRouter as Router } from "react-router-dom";
// route components
import ChessAppContainer from "../../src/App.js";
import HomeContainer from "../../src/Home.js";
import Navbar from "../../src/components/Navbar";

const renderRoutes = () => (
  <Router>
    <div>
      <Route exact path="/" component={Navbar} />
      <Route exact path="/" component={HomeContainer} />
      <Route exact path="/games/" component={ChessAppContainer} />
    </div>
  </Router>
);

export { renderRoutes };
