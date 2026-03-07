import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="navbar">

      <div className="logo">
        VigilAI
        <span>Dashboard</span>
      </div>

      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/actions">Actions</Link>
        <button className="logout">Logout</button>
      </div>

    </div>
  );
}

export default Navbar;

