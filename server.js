const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const User = require("./models/User");
const uploadRoute = require("./routes/upload");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store users with their socket IDs
const users = {};

const PORT = 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/upload", uploadRoute);
app.get("/", (req, res) => {
  res.send("Hello server");
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Listen for "register" event with userId
  socket.on("register", (userId) => {
    users[userId] = socket.id;
    console.log(`👤 User ${userId} registered with socket ${socket.id}`);
    console.log(`📊 Total registered users: ${Object.keys(users).length}`);

    // Send confirmation back to client
    socket.emit("registered", { userId, socketId: socket.id });
  });

  // Listen for "send-message" event
  socket.on("send-message", ({ senderId, receiverId, message, fileUrl }) => {
    console.log(`📨 Message from ${senderId} to ${receiverId}: ${message}`);
    const timeStamp = new Date().toISOString();
    const receiverSocketId = users[receiverId];

    if (receiverSocketId) {
      console.log(`✅ Delivering message to socket: ${receiverSocketId}`);
      io.to(receiverSocketId).emit("receive-message", {
        senderId,
        message,
        fileUrl,
        timeStamp,
      });
    } else {
      console.log(`❌ Receiver ${receiverId} not found in users list`);
      console.log(`📋 Available users: ${Object.keys(users).join(", ")}`);
    }
  });

  // Listen for "typing" event
  socket.on("typing", ({ senderId, receiverId }) => {
    console.log(`⌨️ TYPING: ${senderId} → ${receiverId}`);
    const receiverSocketId = users[receiverId];
    console.log(
      "🔥 Typing from:",
      senderId,
      "to:",
      receiverId,
      "socket:",
      receiverSocketId
    );

    if (receiverSocketId) {
      console.log(`✅ Sending typing event to socket: ${receiverSocketId}`);
      io.to(receiverSocketId).emit("typing", { senderId });
    } else {
      console.log(`❌ TYPING: Receiver ${receiverId} not found`);
      console.log(`📋 Available users: ${Object.keys(users).join(", ")}`);
    }
  });

  // Listen for "stop-typing" event
  socket.on("stop-typing", ({ senderId, receiverId }) => {
    console.log(`🛑 STOP TYPING: ${senderId} → ${receiverId}`);
    const receiverSocketId = users[receiverId];

    if (receiverSocketId) {
      console.log(
        `✅ Sending stop-typing event to socket: ${receiverSocketId}`
      );
      io.to(receiverSocketId).emit("stop-typing", { senderId });
    } else {
      console.log(`❌ STOP TYPING: Receiver ${receiverId} not found`);
      console.log(`📋 Available users: ${Object.keys(users).join(", ")}`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);

    // Find and remove user from users list
    for (const userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        console.log(`👤 User ${userId} removed from users list`);
        break;
      }
    }

    console.log(`📊 Remaining users: ${Object.keys(users).length}`);
  });

  // Error handling
  socket.on("error", (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("📊 MongoDB connected"))
  .catch((err) => console.log("❌ Mongo error:", err));

// Routes
app.use("/api/auth", authRoutes);

// Route: GET /users/:id
app.get("/users/:id", async (req, res) => {
  try {
    const currentUserId = req.params.id;
    console.log(`👥 Fetching users excluding: ${currentUserId}`);

    const users = await User.find({ _id: { $ne: currentUserId } });
    console.log(`✅ Found ${users.length} users`);

    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
