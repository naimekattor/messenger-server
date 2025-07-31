const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const User = require("./models/User");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const users = {};

const PORT = 4000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.get("/", (req, res) => {
  res.send("Hello server");
});

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);
  // Listen for "register" event with userId
  socket.on("register", (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });
  // Listen for "send-message" event
  socket.on("send-message", ({ senderId, receiverId, message }) => {
    console.log(`Message from ${senderId} to ${receiverId}: ${message}`);
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive-message", {
        senderId,
        message,
      });
    }
  });
  socket.on("disconnect", () => {
    for (const userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        console.log(`User ${userId} disconnected and removed from users list`);
      }
    }
    console.log(`Client disconnected: ${socket.id}`);
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Mongo error:", err));

app.use("/api/auth", authRoutes);
// Route: GET /users/:id
app.get("/users/:id", async (req, res) => {
  const currentUserId = req.params.id;
  const users = await User.find({ _id: { $ne: currentUserId } });
  res.json(users);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
