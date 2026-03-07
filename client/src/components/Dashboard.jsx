import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const navigate = useNavigate();

  const [status, setStatus] = useState({
    threatScore: 0,
    threatLevel: "Low",
    downloadCount: 0,
  });

  const [sessions, setSessions] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null); // ✅ NEW STATE

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "admin") {
      navigate("/");
      return;
    }

    const fetchStatus = () => {
      // Fetch threat status
      fetch("http://localhost:5000/status")
        .then((res) => res.json())
        .then((data) => setStatus(data));

      // Fetch session data
      fetch("http://localhost:3000/api/admin/sessions")
        .then((res) => res.json())
        .then((data) => setSessions(data));
    };

    fetchStatus(); // first load

    const interval = setInterval(fetchStatus, 2000); // auto refresh

    return () => clearInterval(interval);
  }, [navigate]);

  const chartData = {
    labels: ["Downloads"],
    datasets: [
      {
        label: "Total Downloads",
        data: [status.downloadCount],
        backgroundColor:
          status.threatLevel === "High"
            ? "#ef4444"
            : status.threatLevel === "Medium"
            ? "#facc15"
            : "#22c55e",
      },
    ],
  };

  return (
    <div>
      <Navbar />

      <div className="container">
        <div className="dashboard-grid">

          {/* Threat Card */}
          <div className="dashboard-card">
            <h2>Threat Score</h2>
            <h1>{status.threatScore}%</h1>
            <p>Level: {status.threatLevel}</p>
          </div>

          {/* Access Card */}
          <div className="dashboard-card">
            <h2>Access Status</h2>
            <p
              style={{
                color:
                  status.threatLevel === "High"
                    ? "#ef4444"
                    : "#22c55e",
                fontWeight: "bold",
              }}
            >
              {status.threatLevel === "High"
                ? "Access Restricted"
                : "Access Allowed"}
            </p>
          </div>

          {/* Chart Card */}
          <div className="dashboard-card full-width">
            <h2>Download Analytics</h2>
            <div className="chart-container">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>

          {/* 🔥 Session Monitoring Table */}
          <div className="dashboard-card full-width">
            <h2>Session Monitoring</h2>

            <table className="session-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Session ID</th>
                  <th>Login</th>
                  <th>Logout</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
             <tbody>
  {sessions.map((session) => (
    <React.Fragment key={session.session_id}>
      {/* Main Row */}
      <tr
        onClick={() =>
          setExpandedSession(
            expandedSession === session.session_id
              ? null
              : session.session_id
          )
        }
        style={{ cursor: "pointer" }}
      >
        <td>{session.user_id}</td>
        <td>{session.session_id}</td>
        <td>
          {new Date(
            session.login_timestamp * 1000
          ).toLocaleTimeString()}
        </td>
        <td>
          {session.logout_timestamp
            ? new Date(
                session.logout_timestamp * 1000
              ).toLocaleTimeString()
            : "Active"}
        </td>
        <td
          style={{
            color: session.logout_timestamp
              ? "#ef4444"
              : "#22c55e",
            fontWeight: "bold",
          }}
        >
          {session.logout_timestamp ? "Ended" : "Active"}
        </td>
        <td>{session.actions.length}</td>
      </tr>

      {/* Expanded Row */}
      {expandedSession === session.session_id && (
        <tr>
          <td colSpan="6">
            <div className="action-history">
              <strong>Action History:</strong>
              {session.actions.length === 0 ? (
                <p>No actions recorded</p>
              ) : (
                session.actions.map((action, index) => (
                  <div key={index}>
                    ➤ {action.page} |{" "}
                    {new Date(
                      action.timestamp * 1000
                    ).toLocaleTimeString()}
                  </div>
                ))
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  ))}
</tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;

