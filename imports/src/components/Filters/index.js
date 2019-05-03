import React from "react";
const Filters = ({ filters, filter, handleDisplayfilter }) => (
  <div className="container">
    {filters.map((param, index) => (
      <div
        onClick={() => handleDisplayfilter(param)}
        key={param}
        className={filter === param ? "highlight" : ""}
      >
        {param}
      </div>
    ))}
    <style jsx>{`
      .highlight {
        background: #090c9b;
      }
      div {
        text-align: center;
        width: 100%;
        cursor: pointer;
        background: #246eb9;
        color: white;
        justify-self: stretch;
        line-height: 2em;
        padding: 5px;
      }
      .container {
        width: 100%;
        display: flex;
        padding: 0;
        margin: 0;
        justify-content: space-between;
        background: none;
      }
    `}</style>
  </div>
);

export default Filters;
