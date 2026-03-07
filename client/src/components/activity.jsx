import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";

function Files() {
  const [threatScore, setThreatScore] = useState(0);

  useEffect(() => {
    console.log("[PAGE LOAD] Files", new Date().toLocaleString());
  }, []);

  const logClick = async (action) => {
    try {
      const sessionId = localStorage.getItem("session_id");
      const username = localStorage.getItem("username");

      const response = await fetch("http://localhost:3000/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: username,                 // ✅ dynamic user
          action: action,
          file: "customer_data.txt",
          session_id: sessionId,          // ✅ VERY IMPORTANT
        }),
      });

      const data = await response.json();
      setThreatScore(data.threatScore);
    } catch (err) {
      console.error("Logging failed:", err);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="container">
        <div className="dashboard">

          {/* 🔥 Threat Panel */}
          <div className="threat-box">
            <h2>Threat Score</h2>
            <h1>{threatScore}%</h1>

            <div className="threat-bar">
              <div
                className="threat-fill"
                style={{
                  width: `${threatScore}%`,
                  background:
                    threatScore < 40
                      ? "#22c55e"
                      : threatScore < 70
                      ? "#facc15"
                      : "#ef4444",
                }}
              ></div>
            </div>
          </div>

          {/* 📁 File Panel */}
          <div className="file-box">
            <p>customer_data.txt</p>
            <button onClick={() => logClick("View")}>View</button>
            <button onClick={() => logClick("Download")}>Download</button>
            <button onClick={() => logClick("Open")}>Open</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Files;


