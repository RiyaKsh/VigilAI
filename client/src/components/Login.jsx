import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../statics/login.css";
import logo from "../statics/Gemini_Generated_Image_v39d9wv39d9wv39d.png";
import { useEffect } from "react";

// useEffect(() => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     navigate("/activity"); // or dashboard
//   }
// }, []);

const Login = () => {

  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  })
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://127.0.0.1:3000/api/users/login",
        credentials
      );
      console.log("Login response:", res.data);
      // Save session data
      localStorage.setItem("token", res.data.token);

      localStorage.setItem("session_id", res.data.session_id);
      localStorage.setItem("user_id", res.data._id);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("email", res.data.email);
      // Admin navigation
      if (
        res.data.username === "admin" &&
        res.data.email === "admin@gmail.com"
      ) {
        navigate("/dashboard");
      } else {
        navigate("/activity");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message);
      } else {
        setError("Server error");
      }
    }
  };

  const handleCredentialChange = (e) => {
    setCredentials(state => ({
      ...state,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <img
          src={logo}
          alt="login"
        />
      </div>
      <div className="login-right">
        <div className="login-box">
          <h2>Welcome back!</h2>
          <p>Please enter your details</p>
          <form onSubmit={handleSubmit}>
            <div className="group">
              <input id="email" name="email" type="email" onChange={handleCredentialChange} value={credentials.email} placeholder="" required />
              <label htmlFor="email">Email</label>
            </div>

            <div className="group">
              <input id="password" name="password" type="password" onChange={handleCredentialChange} value={credentials.password} placeholder="" required />
              <label htmlFor="password">Password</label>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit">Log In</button>
          </form>
         <p className="signup-link">
  Don't have an account?{" "}
  <span onClick={() => navigate("/signup")} className="signup-text">
    Sign Up
  </span>
</p>
<div className="divider"></div>
<p 
  className="admin-access"
  onClick={() => navigate("/admin")}
>
  Admin Access →
</p>      
        </div>
      </div>
    </div>
  );
};

export default Login;
