const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const shortid = require("shortid");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Configure CORS properly
const io = new Server(server, {
  cors: {
    origin: "*", // For now, allow all origins
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Data storage
const users = new Map(); // socket.id → user data
const messages = []; // All messages

// Helper functions
const getOnlineUsers = () => Array.from(users.values()).filter(user => user.online);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send initial data
  socket.emit("chatHistory", messages.slice(-50));
  socket.emit("onlineUsers", {
    users: getOnlineUsers(),
    count: getOnlineUsers().length
  });

  // Set username handler - fixed
  socket.on("setUsername", ({ username, avatar }) => {
    if (username && username.trim()) {
      users.set(socket.id, {
        id: socket.id,
        username: username.trim(),
        avatar: avatar || "👤",
        online: true,
        lastSeen: new Date()
      });

      io.emit("onlineUsers", {
        users: getOnlineUsers(),
        count: getOnlineUsers().length
      });

      socket.emit("usernameSet", { success: true });
    }
  });

  // Message handler - fixed
  socket.on("message", (data) => {
    const user = users.get(socket.id);
    if (!user || !data.message?.trim()) return;

    const message = {
      id: shortid.generate(),
      username: user.username,
      avatar: user.avatar,
      message: data.message.trim(),
      timestamp: new Date().toISOString(),
      sender: socket.id
    };

    messages.push(message);
    io.emit("message", message);
  });

  // Disconnection handler
  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      user.online = false;
      user.lastSeen = new Date();
      io.emit("onlineUsers", {
        users: getOnlineUsers(),
        count: getOnlineUsers().length
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
