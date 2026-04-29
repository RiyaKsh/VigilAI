import React from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const user_id = localStorage.getItem("user_id");

      if (!user_id) {
        alert("User not logged in");
        return;
      }

      await axios.post("http://127.0.0.1:3000/api/users/logout", {
        user_id: user_id,
      });

      // Clear stored data
      localStorage.removeItem("user_id");
      localStorage.removeItem("token");

      // Redirect to login page
      navigate("/");

    } catch (error) {
      console.error("Logout failed:", error);
      alert("Error logging out");
    }
  };

  return (
    <div className="navbar">

      <div className="logo">
        VigilAI
        <span>Dashboard</span>
      </div>

      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/activity">Actions</Link>
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

    </div>
  );
}

export default Navbar;