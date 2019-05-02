import React from "react";
import HomeContainer from "./Home.js";
import Login from "./components/Login";

class LoginHomeSwitch extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    console.log(Meteor.userId());
    return Meteor.userId() ? <HomeContainer /> : <Login />;
  }
}
export default LoginHomeSwitch;
