const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: "*", // Change this to your Netlify URL after deployment
  },
});

app.use(cors());
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(express.static("public")); // Serve frontend files

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When a user sends a message
  socket.on("message", (data) => {
    io.emit("message", data); // Send message to all users
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
