const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000; // Use Render-assigned PORT

const io = new Server(server, {
  cors: {
    origin: "https://front-benchers-chat.netlify.app", // Allow frontend origin
  },
});

app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend files

// Serve index.html when visiting "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Store online users
    socket.on("register", (username) => {
        socket.username = username;
    });

    // Private Messaging
    socket.on("privateMessage", (data) => {
        const { to, message } = data;
        io.to(to).emit("privateMessage", { from: socket.username, message });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});


// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
