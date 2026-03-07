import React from "react";
import Navbar from "./Navbar";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Dashboard() {

  const score = 87;

  return (
    <div className="dashboard">

      <Navbar />

      <h1>Welcome back, John Doe</h1>
      <p>Your security status is being monitored in real-time</p>

      <div className="cards">

        <div className="card">
          <h3>Session Trust Score</h3>

          <div className="gauge">
            <CircularProgressbar value={score} text={`${score}`} />
          </div>

          <p>Your behavior is within normal parameters</p>
        </div>


        <div className="card">
          <h3>Risk Status</h3>
          <div className="shield">🛡</div>
          <h2 className="low">LOW</h2>
          <p>No threats detected</p>

          <div className="stats">
            <div>
              <h3>0</h3>
              <p>Anomalies</p>
            </div>

            <div>
              <h3>24</h3>
              <p>Active Sessions</p>
            </div>
          </div>
        </div>


        <div className="card">
          <h3>Recent Activity</h3>

          <ul>
            <li>Successful login</li>
            <li>Viewed financial report</li>
            <li>Downloaded document</li>
            <li>Password changed</li>
          </ul>

          <button className="btn">View All Actions</button>
        </div>

      </div>


      <div className="timeline">

        <h2>Security Timeline</h2>

        <div className="timeline-item">Login from San Francisco</div>
        <div className="timeline-item">File access: Q1_Report.pdf</div>
        <div className="timeline-item">System scan completed</div>
        <div className="timeline-item">Session started</div>

      </div>

    </div>
  );
}

export default Dashboard;