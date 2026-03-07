import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import Activity from "./components/activity";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* USER PAGES */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/actions" element={<Activity />} />

        {/* ADMIN PAGE */}
        <Route path="/admin" element={<AdminDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;