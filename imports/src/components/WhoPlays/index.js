import React from "react";
const WhoPlays = ({ users }) => (
  <h2>
    {users.map((user, index) => "" + (index === 0 ? "" : " vs. ") + user.name)}
    <style jsx>{`
      h2 {
        grid-area: g;
        font-weight: bold;
        margin: 0;
        padding: 0;
      }
    `}</style>
  </h2>
);
export default WhoPlays;
