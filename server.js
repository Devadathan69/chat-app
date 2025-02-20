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

const io = require("socket.io")(server, {
    cors: { origin: "*" },
});

let onlineUsers = [];

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("message", (data) => {
        io.emit("message", data); // Broadcast message to all clients
    });

    socket.on("typing", (username) => {
        socket.broadcast.emit("typing", username);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});



// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
