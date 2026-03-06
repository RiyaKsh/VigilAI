import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");

  // 🔐 Auto redirect if already logged in
  useEffect(() => {
    const existingRole = localStorage.getItem("role");

    if (existingRole === "admin") {
      navigate("/dashboard");
    } else if (existingRole === "user") {
      navigate("/activity");
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      // 🔥 STORE EVERYTHING INCLUDING session_id
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username);
      localStorage.setItem("session_id", data.session_id);

      if (data.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/activity");
      }
    } catch (err) {
      setError("Login failed. Backend not reachable.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Threat Detection System</h1>

       <select
  value={role}
  onChange={(e) => setRole(e.target.value)}
>
  <option value="user">Employee Login</option>
  <option value="admin">Admin Login</option>
</select>
        <input
          type="text"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p style={{ color: "#ef4444", marginBottom: "15px" }}>
            {error}
          </p>
        )}

        <button onClick={handleLogin}>Sign In</button>
      </div>
    </div>
  );
}

export default Login;
