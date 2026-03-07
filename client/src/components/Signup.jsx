import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../statics/login.css";
import logo from "../statics/Gemini_Generated_Image_v39d9wv39d9wv39d.png";

const Signup = () => {

  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username:"",
    email: "",
    password: ""
  })
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://127.0.0.1:3000/api/users/register",
        credentials
      );
      // Save session data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_id", res.data._id);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("email", res.data.email);
      if(res.status === 201){
        alert("Account created successfully!");
        navigate("/");
      }else{
        alert("Wrong credentials");
      }
    } catch (err) {
      if (err.response) {
        alert("Wrong Credentials");
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
          <h2>Create your account</h2>
          <p>Please enter your details</p>
          <form onSubmit={handleSubmit}>
            <div className="group">
              <input id="username" name="username" type="text" onChange={handleCredentialChange} value={credentials.username} placeholder="" required />
              <label htmlFor="username">Username</label>
            </div>

            <div className="group">
              <input id="email" name="email" type="email" onChange={handleCredentialChange} value={credentials.email} placeholder="" required />
              <label htmlFor="email">Email</label>
            </div>

            <div className="group">
              <input id="password" name="password" type="password" onChange={handleCredentialChange} value={credentials.password} placeholder="" required />
              <label htmlFor="password">Password</label>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit">Sign Up</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
