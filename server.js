const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));
app.use(cors());

const io = new Server(server, {
    cors: { origin: "*" },
});

let messages = [];
let onlineUsers = new Map();

// Handle file upload endpoint
app.post("/upload", upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded");
    }
    res.json({ 
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: `/uploads/${req.file.filename}`
    });
});

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

    socket.on("voiceMessage", (data) => {
        messages.push(data);
        io.emit("voiceMessage", data);
    });

    socket.on("fileMessage", (data) => {
        messages.push(data);
        io.emit("fileMessage", data);
    });

    socket.on("disconnect", () => {
        onlineUsers.delete(socket.id);
        io.emit("onlineUsers", Array.from(onlineUsers.values()));
    });
});

// Clean up uploads directory on server start
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
