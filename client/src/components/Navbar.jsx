import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const logout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/activity">Activity</Link>

      {role === "admin" && (
        <Link to="/dashboard">Dashboard</Link>
      )}

      <div style={{ marginLeft: "auto", display: "flex", gap: "20px", alignItems: "center" }}>
        <span style={{ color: "#94a3b8" }}>
          Logged in as: <strong>{username}</strong>
        </span>

        <button onClick={logout}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;