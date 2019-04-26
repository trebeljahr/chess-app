import React from "react";
const WhoPlays = ({ users }) => (
  <div>
    {users.map((user, index) => "" + (index === 0 ? "" : " vs.") + user.name)}
    <style jsx>{`
      div {
        grid-area: g;
      }
    `}</style>
  </div>
);
export default WhoPlays;
