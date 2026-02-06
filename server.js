const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
    cors: { origin: "*" },
    maxHttpBufferSize: 1e8 // 100 MB for file uploads via socket
});

// State Management
let users = {}; // socket.id -> { id, username, room, online: true }
let rooms = {
    'general': { name: 'General', type: 'public', users: [] }
}; // roomName -> { name, type, users: [socketId] }

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Initial Setup
    socket.emit("roomList", getRoomList());

    // User Login (Set Username)
    socket.on("joinApp", (username) => {
        users[socket.id] = { 
            id: socket.id, 
            username, 
            room: null 
        };
        // Auto-join General
        joinRoom(socket, 'general');
        broadcastOnlineUsers();
    });

    // Join Room
    socket.on("joinRoom", (roomName) => {
        joinRoom(socket, roomName);
    });

    // Create Room
    socket.on("createRoom", (roomName) => {
        if (!rooms[roomName]) {
            rooms[roomName] = { name: roomName, type: 'public', users: [] };
            io.emit("roomList", getRoomList());
        }
        joinRoom(socket, roomName);
    });

    // Send Message (Text, Code, File)
    socket.on("sendMessage", (data) => {
        // data: { type: 'text'|'code'|'file', content, fileName?, language? }
        const user = users[socket.id];
        if (user && user.room) {
            const messageData = {
                id: uuidv4(),
                type: data.type || 'text',
                content: data.content,
                fileName: data.fileName,
                language: data.language, // for code
                sender: user.username,
                senderId: socket.id,
                timestamp: new Date().toISOString(),
                room: user.room
            };
            io.to(user.room).emit("receiveMessage", messageData);
        }
    });

    // Private Message
    socket.on("sendPrivateMessage", ({ toSocketId, content, type = 'text', fileName, language }) => {
        const sender = users[socket.id];
        const recipient = users[toSocketId];

        if (sender && recipient) {
            const messageData = {
                id: uuidv4(),
                type: type,
                content: content,
                fileName: fileName,
                language: language,
                sender: sender.username,
                senderId: socket.id,
                timestamp: new Date().toISOString(),
                isPrivate: true
            };
            // Send to sender and recipient
            io.to(toSocketId).emit("receivePrivateMessage", messageData);
            socket.emit("receivePrivateMessage", messageData);
        }
    });

    // Typing Status
    socket.on("typing", (isTyping) => {
        const user = users[socket.id];
        if (user && user.room) {
            socket.to(user.room).emit("userTyping", { username: user.username, isTyping });
        }
    });

    // Disconnect
    socket.on("disconnect", () => {
        const user = users[socket.id];
        if (user) {
            leaveRoom(socket);
            delete users[socket.id];
            broadcastOnlineUsers();
        }
        console.log("User disconnected:", socket.id);
    });
});

// Helper Functions
function joinRoom(socket, roomName) {
    const user = users[socket.id];
    if (!user) return; // Should not happen if flow is correct

    // Leave current room if any
    if (user.room) {
        leaveRoom(socket);
    }

    if (!rooms[roomName]) {
        rooms[roomName] = { name: roomName, type: 'public', users: [] };
        io.emit("roomList", getRoomList());
    }

    socket.join(roomName);
    user.room = roomName;
    rooms[roomName].users.push(socket.id);

    // Notify room and user
    socket.emit("joinedRoom", roomName);
    // Send system message to room
    io.to(roomName).emit("receiveMessage", {
        id: uuidv4(),
        type: 'system',
        content: `${user.username} has joined the room.`,
        timestamp: new Date().toISOString()
    });
    
    // Update UI for everyone in that room (if we want room-specific user lists, for now global online list)
    // Actually, let's keep the main request: Sidebar shows "Online People".
}

function leaveRoom(socket) {
    const user = users[socket.id];
    if (user && user.room && rooms[user.room]) {
        const roomName = user.room;
        socket.leave(roomName);
        rooms[roomName].users = rooms[roomName].users.filter(id => id !== socket.id);
        
        // Notify leaving
        io.to(roomName).emit("receiveMessage", {
            id: uuidv4(),
            type: 'system',
            content: `${user.username} has left the room.`,
            timestamp: new Date().toISOString()
        });
        
        user.room = null;
    }
}

function getRoomList() {
    return Object.keys(rooms).map(key => ({
        id: key,
        name: rooms[key].name,
        userCount: rooms[key].users.length
    }));
}

function broadcastOnlineUsers() {
    const onlineList = Object.values(users).map(u => ({
        id: u.id,
        username: u.username
    }));
    io.emit("onlineUsers", onlineList);
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
