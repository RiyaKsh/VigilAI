import React from "react";
import Navbar from "./Navbar";

function Activity() {
  const user_id = localStorage.getItem("user_id");

  const trackAction = async (page, event) => {
    try {
      await fetch("http://localhost:3000/api/users/track-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: user_id,
          page: page,
          event: event
        })
      });

      console.log("Action tracked:", event);

      // ✅ STORE IN LOCALSTORAGE
      const key = `activity_${user_id}`;

      const existingData =
        JSON.parse(localStorage.getItem(key)) || [];

      const newAction = {
        page,
        event,
        timestamp: new Date().toISOString()
      };

      // ✅ Avoid duplicate spam (optional logic)
      const filtered = existingData.filter(
        (item) => item.event !== event
      );

      const updatedData = [...filtered, newAction];

      localStorage.setItem(key, JSON.stringify(updatedData));

      // ✅ Trigger update in other tabs/components
      window.dispatchEvent(new Event("activityUpdated"));

    } catch (error) {
      console.log("Failed to track action:", error);
    }
  };

  return (
    <div className="dashboard">
      <Navbar />

      <h1>System Actions</h1>

      <div className="actions">

        <div
          className="action-card"
          onClick={() => trackAction("/reports", "VIEW_REPORT")}
        >
          View Report
        </div>

        <div
          className="action-card"
          onClick={() => trackAction("/files", "DOWNLOAD_FILE")}
        >
          Download File
        </div>

        <div
          className="action-card"
          onClick={() => trackAction("/files", "UPLOAD_DOCUMENT")}
        >
          Upload Document
        </div>

        <div
          className="action-card"
          onClick={() => trackAction("/finance", "ACCESS_FINANCIAL_DATA")}
        >
          Access Financial Data
        </div>

        <div
          className="action-card"
          onClick={() => trackAction("/analytics", "VIEW_ANALYTICS")}
        >
          View Analytics
        </div>

        <div
          className="action-card"
          onClick={() => trackAction("/settings", "CHANGE_PASSWORD")}
        >
          Change Password
        </div>

      </div>
    </div>
  );
}

export default Activity;