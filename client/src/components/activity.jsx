import React from "react";
import Navbar from "./Navbar";

function Activity() {

  return (
    <div className="dashboard">

      <Navbar />

      <h1>System Actions</h1>

      <div className="actions">

        <div className="action-card">View Report</div>
        <div className="action-card">Download File</div>
        <div className="action-card">Upload Document</div>
        <div className="action-card">Access Financial Data</div>
        <div className="action-card">View Analytics</div>
        <div className="action-card">Change Password</div>

      </div>

    </div>
  );
}

export default Activity;
