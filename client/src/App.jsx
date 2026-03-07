import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import Activity from "./components/activity";
import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* USER PAGES */}
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/signup" element={<Signup />} />
        {/* ADMIN PAGE */}
        <Route path="/admin" element={<AdminDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;