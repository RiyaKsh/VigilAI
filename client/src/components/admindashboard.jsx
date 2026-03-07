import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

function AdminDashboard() {

  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [riskData, setRiskData] = useState([]);
  const [trendData, setTrendData] = useState([]);

  const [stats, setStats] = useState({
    activeUsers: 0,
    suspiciousSessions: 0,
    highRiskUsers: 0,
    alerts: 0
  });

  const fetchUsers = async () => {
    try {

      const res = await fetch("http://localhost:5000/api/admin/users-risk");
      const data = await res.json();

      setUsers(data);

      // compute stats
      const highRisk = data.filter(u => u.risk_level === "HIGH").length;
      const mediumRisk = data.filter(u => u.risk_level === "MEDIUM").length;
      const lowRisk = data.filter(u => u.risk_level === "LOW").length;

      setStats(prev => ({
        ...prev,
        activeUsers: data.length,
        highRiskUsers: highRisk,
        suspiciousSessions: mediumRisk
      }));

      setRiskData([
        { name: "Low", value: lowRisk },
        { name: "Medium", value: mediumRisk },
        { name: "High", value: highRisk }
      ]);

      // simple trend from trust scores
      const trend = data.slice(0, 7).map((u, i) => ({
        name: `User ${i + 1}`,
        score: u.trust_score
      }));

      setTrendData(trend);

    } catch (err) {
      console.log(err);
    }
  };

  const fetchAlerts = async () => {
    try {

      const res = await fetch("http://localhost:5000/api/admin/alerts");
      const data = await res.json();

      setAlerts(data.alerts || []);

      setStats(prev => ({
        ...prev,
        alerts: data.total_alerts || 0
      }));

    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {

    fetchUsers();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchUsers();
      fetchAlerts();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  return (
    <div className="dashboard">

      {/* <Navbar /> */}

      <h1>TrustLayer Admin</h1>

      {/* TOP CARDS */}

      <div className="cards">

        <div className="card">
          <h2>{stats.activeUsers}</h2>
          <p>Active Users</p>
        </div>

        <div className="card">
          <h2>{stats.suspiciousSessions}</h2>
          <p>Suspicious Sessions</p>
        </div>

        <div className="card">
          <h2>{stats.highRiskUsers}</h2>
          <p>High Risk Users</p>
        </div>

        <div className="card">
          <h2>{stats.alerts}</h2>
          <p>Alerts Detected</p>
        </div>

      </div>


      {/* SECOND ROW */}

      <div className="admin-grid">

        {/* USER RISK TABLE */}

        <div className="table-card">

          <h2>User Risk Overview</h2>

          <table>

            <thead>
              <tr>
                <th>User</th>
                <th>Trust Score</th>
                <th>Threat Score</th>
                <th>Risk Level</th>
              </tr>
            </thead>

            <tbody>

              {users.map((user, index) => (

                <tr key={index}>
                  <td>{user.user_id}</td>
                  <td>{user.trust_score}</td>
                  <td>{user.threat_score}</td>

                  <td className={user.risk_level.toLowerCase()}>
                    {user.risk_level}
                  </td>
                </tr>

              ))}

            </tbody>

          </table>

        </div>


        {/* PIE CHART */}

        <div className="chart-card">

          <h2>Risk Distribution</h2>

          <PieChart width={300} height={300}>

            <Pie
              data={riskData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
            >

              {riskData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}

            </Pie>

          </PieChart>

        </div>

      </div>


      {/* THIRD ROW */}

      <div className="admin-grid">

        {/* ALERTS */}

        <div className="alert-card">

          <h2>Live Alerts</h2>

          {alerts.map((alert, index) => (

            <div
              key={index}
              className={`alert ${alert.risk_level === "HIGH" ? "red" : "yellow"}`}
            >
              User {alert.user_id} — {alert.reasons?.[0]}
            </div>

          ))}

        </div>


        {/* LINE CHART */}

        <div className="chart-card">

          <h2>Trust Score Trend</h2>

          <LineChart width={400} height={250} data={trendData}>

            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="score"
              stroke="#10b981"
            />

          </LineChart>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;