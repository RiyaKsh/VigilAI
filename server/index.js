const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let downloadCount = 0;
let sessions = {};

function checkSessionTimeout() {
  const now = Math.floor(Date.now() / 1000);

  for (let id in sessions) {
    const session = sessions[id];

    if (
      session.logout_timestamp === null &&
      now - session.last_activity_timestamp > 60
    ) {
      session.logout_timestamp = now;
      console.log("Session auto-expired:", session);
    }
  }
}
setInterval(checkSessionTimeout, 10000);

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  const sessionId = "S" + Date.now();
  const now = Math.floor(Date.now() / 1000);

  const newSession = {
    user_id: username,
    session_id: sessionId,
    login_timestamp: now,
    logout_timestamp: null,
    last_activity_timestamp: now,
    actions: [],
  };

  sessions[sessionId] = newSession;

  console.log("User attempting login:", username, "| Role:", role);
  console.log("New session created:", newSession);

  res.json({
    message: "Login successful",
    role,
    username,
    session_id: sessionId,
  });
});

// 📌 Log user actions (Add to session)
app.post("/log", (req, res) => {
  const { user, action, file, session_id } = req.body;

  const now = Math.floor(Date.now() / 1000);

  if (action === "Download") {
    downloadCount++;
  }

  let threatScore = Math.min(downloadCount * 20, 100);

  let threatLevel = "Low";
  if (threatScore >= 70) threatLevel = "High";
  else if (threatScore >= 40) threatLevel = "Medium";

  // 🔥 Add action to session + update last activity
  if (sessions[session_id]) {
    sessions[session_id].actions.push({
      page: action,
      timestamp: now,
    });

    sessions[session_id].last_activity_timestamp = now; 
  }

  res.json({
    threatLevel,
    threatScore,
    downloadCount,
  });
});

app.get("/status", (req, res) => {
  checkSessionTimeout(); 

  let threatScore = Math.min(downloadCount * 20, 100);

  let threatLevel = "Low";
  if (threatScore >= 70) threatLevel = "High";
  else if (threatScore >= 40) threatLevel = "Medium";

  res.json({
    threatScore,
    threatLevel,
    downloadCount,
  });
});
// 🚪 Logout route (End session)
app.post("/logout", (req, res) => {
  const { session_id } = req.body;

  if (sessions[session_id]) {
    sessions[session_id].logout_timestamp = Math.floor(Date.now() / 1000);

    console.log("Session ended:");
    console.log(sessions[session_id]);
  }

  res.json({ message: "Logged out successfully" });
});


app.get("/sessions", (req, res) => {
  checkSessionTimeout();

  const sessionList = Object.values(sessions);

  res.json(sessionList);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});