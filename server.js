const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const shortid = require("shortid");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  },
});

app.use(cors());
app.use(express.json());

// Data structures
const users = new Map(); // socket.id -> user data
const messages = []; // All messages
const privateRooms = new Map(); // roomId -> { participants: [socketId1, socketId2] }

// Helper functions
const getUserById = (id) => users.get(id);
const getOnlineUsers = () => Array.from(users.values()).filter(user => user.online);

// When a user connects
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send chat history and online users
  socket.emit("chatHistory", messages.slice(-100)); // Last 100 messages
  socket.emit("onlineUsers", { 
    users: getOnlineUsers(), 
    count: getOnlineUsers().length 
  });

  // Set username handler
  socket.on("setUsername", ({ username, avatar }) => {
    if (username && username.trim() !== "") {
      users.set(socket.id, {
        id: socket.id,
        username: username.trim(),
        avatar: avatar || "👤",
        online: true,
        lastSeen: new Date()
      });
      
      console.log(`User registered: ${username}`);
      io.emit("onlineUsers", { 
        users: getOnlineUsers(), 
        count: getOnlineUsers().length 
      });
    }
  });

  // Message handler
  socket.on("message", (data) => {
    if (!data.username || !data.message?.trim()) return;

    const user = getUserById(socket.id);
    if (!user) return;

    const message = {
      id: shortid.generate(),
      username: user.username,
      avatar: user.avatar,
      message: data.message.trim(),
      timestamp: new Date().toISOString(),
      room: data.room || "general",
      reactions: {}
    };

    messages.push(message);
    
    if (message.room === "general") {
      io.emit("message", message);
    } else {
      io.to(message.room).emit("message", message);
    }
  });

  // Typing indicators
  socket.on("typing", () => {
    const user = getUserById(socket.id);
    if (user) {
      socket.broadcast.emit("typing", user.username);
    }
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

  // Reaction handler
  socket.on("reactToMessage", ({ messageId, reaction }) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      message.reactions[reaction] = (message.reactions[reaction] || 0) + 1;
      io.emit("messageUpdated", message);
    }
  });

  // Private chat handlers
  socket.on("createPrivateRoom", ({ targetUserId }) => {
    const targetUser = Array.from(users.values()).find(u => u.id === targetUserId);
    if (!targetUser) return;

    const existingRoom = Array.from(privateRooms.entries()).find(([_, room]) => {
      return room.participants.includes(socket.id) && room.participants.includes(targetUserId);
    });

    if (existingRoom) {
      socket.join(existingRoom[0]);
      socket.emit("privateRoomCreated", { 
        roomId: existingRoom[0], 
        targetUser: targetUser.username 
      });
    } else {
      const roomId = `private_${shortid.generate()}`;
      privateRooms.set(roomId, {
        participants: [socket.id, targetUserId],
        createdAt: new Date()
      });
      
      socket.join(roomId);
      io.to(targetUserId).join(roomId);
      
      socket.emit("privateRoomCreated", { 
        roomId, 
        targetUser: targetUser.username 
      });
      io.to(targetUserId).emit("privateRoomCreated", { 
        roomId, 
        targetUser: users.get(socket.id).username 
      });
    }
  });

  // Disconnection handler
  socket.on("disconnect", () => {
    const user = getUserById(socket.id);
    if (user) {
      user.online = false;
      user.lastSeen = new Date();
      console.log(`User disconnected: ${user.username}`);
      io.emit("onlineUsers", { 
        users: getOnlineUsers(), 
        count: getOnlineUsers().length 
      });
    }
  });
});

const io = new Server(server, {
  cors: {
    origin: [
      "https://gabbly.netlify.app",
      "http://localhost:3000" // for local testing
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    users: getOnlineUsers().length,
    messages: messages.length,
    privateRooms: privateRooms.size
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
