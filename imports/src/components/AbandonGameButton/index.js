import React from "react";
import { invertColor } from "../../helpers/invertColor.js";
class AbandonGameButton extends React.Component {
  constructor(props) {
    super(props);
  }
  handleClick = () => {
    FlowRouter.go("Home");
  };
  render() {
    return (
      <div style={{ gridArea: "d" }} onClick={this.handleClick}>
        <i className="fas fa-door-open fa-2x" />

        <style jsx>{`
          div {
            color: black;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #d9dcd6;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }
}
export default AbandonGameButton;
