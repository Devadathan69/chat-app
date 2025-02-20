const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
    cors: { origin: "*" },
});

let messages = [];
let onlineUsers = new Map();

// Function to update online users
function updateOnlineUsers() {
    io.emit("onlineUsers", { users: Array.from(onlineUsers.values()), count: onlineUsers.size });
}

// When a user connects
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.emit("chatHistory", messages);

    // Listen for username setup
    socket.on("setUsername", (username) => {
        if (username.trim() !== "") {
            onlineUsers.set(socket.id, username);
            console.log(`User set name: ${username}`);
            updateOnlineUsers();
        }
    });

    // Listen for messages
    socket.on("message", (data) => {
        if (data.username && data.message.trim() !== "") {
            messages.push(data);
            io.emit("message", data);
        }
    });

    // Listen for typing
    socket.on("typing", (username) => {
        socket.broadcast.emit("typing", username);
    });

    socket.on("stopTyping", () => {
        socket.broadcast.emit("stopTyping");
    });

    // When a user disconnects
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        onlineUsers.delete(socket.id);
        updateOnlineUsers();
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
