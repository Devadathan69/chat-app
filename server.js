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

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.emit("chatHistory", messages);

    socket.on("setUsername", (username) => {
        onlineUsers.set(socket.id, username);
        io.emit("onlineUsers", Array.from(onlineUsers.values()));
    });

    socket.on("message", (data) => {
        messages.push(data);
        io.emit("message", data);
    });

    socket.on("typing", (username) => {
        socket.broadcast.emit("typing", username);
    });

    socket.on("stopTyping", () => {
        socket.broadcast.emit("stopTyping");
    });

    socket.on("disconnect", () => {
        onlineUsers.delete(socket.id);
        io.emit("onlineUsers", Array.from(onlineUsers.values()));
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
