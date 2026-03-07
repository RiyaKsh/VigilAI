import React from "react";
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

const data = [
  { name: "Mon", score: 82 },
  { name: "Tue", score: 85 },
  { name: "Wed", score: 83 },
  { name: "Thu", score: 87 },
  { name: "Fri", score: 84 },
  { name: "Sat", score: 86 },
  { name: "Sun", score: 88 }
];

const riskData = [
  { name: "Low", value: 80 },
  { name: "Medium", value: 15 },
  { name: "High", value: 5 }
];

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

function AdminDashboard() {

  return (
    <div className="dashboard">

      <Navbar />

      <h1>TrustLayer Admin</h1>

      {/* TOP CARDS */}

      <div className="cards">

        <div className="card">
          <h2>2,847</h2>
          <p>Active Users</p>
        </div>

        <div className="card">
          <h2>23</h2>
          <p>Suspicious Sessions</p>
        </div>

        <div className="card">
          <h2>5</h2>
          <p>High Risk Users</p>
        </div>

        <div className="card">
          <h2>142</h2>
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
              <tr>
                <td>Alice Johnson</td>
                <td>92</td>
                <td>8</td>
                <td className="low">Low</td>
              </tr>

              <tr>
                <td>Bob Smith</td>
                <td>45</td>
                <td>55</td>
                <td className="high">High</td>
              </tr>

              <tr>
                <td>Carol Williams</td>
                <td>78</td>
                <td>22</td>
                <td className="low">Low</td>
              </tr>

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
                <Cell key={index} fill={COLORS[index]} />
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

          <div className="alert red">
            Unusual login pattern detected - Bob Smith
          </div>

          <div className="alert yellow">
            Multiple failed login attempts
          </div>

          <div className="alert red">
            File access anomaly - Frank Miller
          </div>

        </div>


        {/* LINE CHART */}

        <div className="chart-card">

          <h2>Trust Score Trend</h2>

          <LineChart width={400} height={250} data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#10b981" />
          </LineChart>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;