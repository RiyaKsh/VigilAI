import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Dashboard() {

  const [session, setSession] = useState(null);
  const [localActions, setLocalActions] = useState([]);

  const user_id = localStorage.getItem("user_id");

  // ✅ FETCH BACKEND SESSION
  const fetchSession = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/session/status/${user_id}`
      );

      const data = await res.json();
      setSession(data);

    } catch (error) {
      console.log("Failed to fetch session:", error);
    }
  };

  // ✅ LOAD LOCALSTORAGE DATA
  const loadLocalActions = () => {
    const key = `activity_${user_id}`;
    const data = JSON.parse(localStorage.getItem(key)) || [];
    setLocalActions(data);
  };

  useEffect(() => {
    fetchSession();
    loadLocalActions();

    const interval = setInterval(fetchSession, 5000);

    // ✅ Listen for updates
    window.addEventListener("activityUpdated", loadLocalActions);

    return () => {
      clearInterval(interval);
      window.removeEventListener("activityUpdated", loadLocalActions);
    };

  }, []);

  // ✅ MERGE BACKEND + LOCAL DATA
  const mergedActions = [
    ...(session?.actions || []),
    ...localActions
  ];

  const score = session?.trust_score || 0;
  const risk = session?.risk_level || "LOW";

  return (
    <div className="dashboard">

      <Navbar />

      <h1>Welcome back</h1>
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

          <h2 className={risk.toLowerCase()}>
            {risk}
          </h2>

          <p>Live session risk monitoring</p>

          <div className="stats">

            <div>
              <h3>{session?.reasons?.length || 0}</h3>
              <p>Anomalies</p>
            </div>

            <div>
              <h3>{mergedActions.length}</h3>
              <p>Actions</p>
            </div>

          </div>

        </div>


        <div className="card">

          <h3>Recent Activity</h3>

          <ul>
            {mergedActions.slice(-4).map((action, i) => (
              <li key={i}>
                {action.event}
              </li>
            ))}
          </ul>

          <button className="btn">
            View All Actions
          </button>

        </div>

      </div>


      <div className="timeline">

        <h2>Security Timeline</h2>

        {mergedActions.slice(-5).map((action, i) => (
          <div className="timeline-item" key={i}>
            {action.event}
          </div>
        ))}

      </div>


      <div className="reasons">

        <h2>Detection Reasons</h2>

        <ul>
          {session?.reasons?.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>

      </div>

    </div>
  );
}

export default Dashboard;