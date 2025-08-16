const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

const io = new Server(server, {
  cors: { origin: "*" },
});

/**
 * In-memory store:
 *  Each message is:
 *   { username, type: "text"|"file"|"audio", text?, fileName?, mime?, dataURL?, time }
 * This is volatile (no DB) and resets on restart as requested.
 */
let messages = [];
let onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send history to the new client
  socket.emit("chatHistory", messages);

  // Track online users
  socket.on("setUsername", (username) => {
    onlineUsers.set(socket.id, username || "Anonymous");
    io.emit("onlineUsers", Array.from(onlineUsers.values()));
  });

  // Handle incoming messages of any supported type
  socket.on("message", (data) => {
    const safe = {
      username: (data && data.username) || "Anonymous",
      type: data?.type || "text",
      text: data?.text || "",
      fileName: data?.fileName || "",
      mime: data?.mime || "",
      dataURL: data?.dataURL || "",
      time: data?.time || Date.now(),
    };
    messages.push(safe);
    // Limit history to last 500 messages to avoid memory bloat on free hosts
    if (messages.length > 500) messages = messages.slice(-500);
    io.emit("message", safe);
  });

  // Typing indicators
  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username || "Someone");
  });
  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

  // Disconnect
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.values()));
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
