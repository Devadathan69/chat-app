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
    'general': { name: 'General', type: 'public', creator: 'system', users: [] }
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
    socket.on("createRoom", ({ roomName, type }) => { // type: 'public' or 'private'
        if (!rooms[roomName]) {
            rooms[roomName] = {
                name: roomName,
                type: type || 'public',
                creator: socket.id,
                users: []
            };
            io.emit("roomList", getRoomList());
        }
        joinRoom(socket, roomName);
    });

    // Close Room (Delete)
    socket.on("closeRoom", (roomName) => {
        const room = rooms[roomName];
        if (room && room.creator === socket.id) {
            // Kick everyone out
            room.users.forEach(userId => {
                const userSocket = io.sockets.sockets.get(userId);
                if (userSocket) {
                    leaveRoom(userSocket);
                    // Notify them
                    userSocket.emit("receiveMessage", {
                        id: uuidv4(),
                        type: 'system',
                        content: `Room "${roomName}" has been closed by the host.`,
                        timestamp: new Date().toISOString()
                    });
                    // Join general fallback
                    joinRoom(userSocket, 'general');
                }
            });

            delete rooms[roomName];
            io.emit("roomList", getRoomList());
        }
    });

    // Join Private Room (via code/name)
    socket.on("joinPrivateRoom", (roomName) => {
        if (rooms[roomName]) {
            joinRoom(socket, roomName);
        } else {
            socket.emit("error", "Room not found");
        }
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

            // Optional: If creator leaves, close room? Or transfer ownership?
            // For now, let's keep room open until explicit close, 
            // but if empty, maybe delete?
            // If it's a private custom room and empty, delete it to save memory.
            // (handled in leaveRoom logic below if modified)
        }
        console.log("User disconnected:", socket.id);
    });
});

// Helper Functions
function joinRoom(socket, roomName) {
    const user = users[socket.id];
    if (!user) return;

    // Leave current room if any
    if (user.room) {
        leaveRoom(socket);
    }

    if (!rooms[roomName]) {
        // If trying to join non-existent, default to create public? 
        // Or fail? For generic 'joinRoom' we might auto-create, 
        // but let's restrict auto-create to public for simplicity in this flow,
        // or just allow it.
        rooms[roomName] = { name: roomName, type: 'public', creator: socket.id, users: [] };
        io.emit("roomList", getRoomList());
    }

    socket.join(roomName);
    user.room = roomName;
    rooms[roomName].users.push(socket.id);

    // Notify room and user
    // Send full room info to user so they know if they are creator
    socket.emit("joinedRoom", {
        name: rooms[roomName].name,
        creator: rooms[roomName].creator,
        type: rooms[roomName].type
    });

    // Send system message to room
    io.to(roomName).emit("receiveMessage", {
        id: uuidv4(),
        type: 'system',
        content: `${user.username} has joined the room.`,
        timestamp: new Date().toISOString()
    });
}

function leaveRoom(socket) {
    const user = users[socket.id];
    if (user && user.room && rooms[user.room]) {
        const roomName = user.room;
        socket.leave(roomName);
        if (rooms[roomName]) {
            rooms[roomName].users = rooms[roomName].users.filter(id => id !== socket.id);

            // Notify leaving
            io.to(roomName).emit("receiveMessage", {
                id: uuidv4(),
                type: 'system',
                content: `${user.username} has left the room.`,
                timestamp: new Date().toISOString()
            });

            // Cleanup empty rooms (except 'general')
            if (rooms[roomName].users.length === 0 && roomName !== 'general') {
                delete rooms[roomName];
                io.emit("roomList", getRoomList());
            }
        }

        user.room = null;
    }
}

function getRoomList() {
    return Object.keys(rooms)
        .filter(key => rooms[key].type === 'public') // Only list public rooms
        .map(key => ({
            id: key,
            name: rooms[key].name,
            userCount: rooms[key].users.length,
            type: rooms[key].type
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
