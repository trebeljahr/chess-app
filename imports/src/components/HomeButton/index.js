import React from "react";

const HomeButton = ({ moveHistory }) => (
  <div style={{ gridArea: "c" }}>
    <a className="btn btn-primary" href="/">
      <i className="fas fa-home fa-2x" />
    </a>
    <style jsx>{`
      a {
        background: #258ea6;
        color: white;
      }
    `}</style>
  </div>
);
export default HomeButton;
