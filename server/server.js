const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const Message = require("./models/Message");

dotenv.config();

const app = express();
const server = http.createServer(app);

// =======================
// ✅ SOCKET.IO SETUP (FIXED)
// =======================
const io = new Server(server, {
    cors: {
        origin: "*", // allow all frontend (Vercel, mobile, etc.)
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
});

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json());

// =======================
// MONGODB CONNECTION
// =======================
mongoose.connect(process.env.MONGO_URL)
.then(() => {
    console.log("MongoDB Connected ✅");
})
.catch((error) => {
    console.log("MongoDB Error:", error);
});

// =======================
// SOCKET CONNECTION
// =======================
io.on("connection", (socket) => {

    console.log("User Connected 🔥");

    // USER ONLINE
    socket.on("user_online", (username) => {
        socket.username = username;

        io.emit("online_users", {
            user: username,
            status: "online"
        });
    });

    // TYPING
    socket.on("typing", (username) => {
        socket.broadcast.emit(
            "show_typing",
            `${username} is typing...`
        );
    });

    // STOP TYPING
    socket.on("stop_typing", () => {
        socket.broadcast.emit("hide_typing");
    });

    // SEND MESSAGE
    socket.on("send_message", async (data) => {
        try {
            const newMessage = new Message(data);
            await newMessage.save();

            io.emit("receive_message", newMessage);

        } catch (error) {
            console.log("Message Error:", error);
        }
    });

    // DISCONNECT
    socket.on("disconnect", () => {

        if (socket.username) {
            io.emit("online_users", {
                user: socket.username,
                status: "offline"
            });
        }

        console.log("User Disconnected ❌");
    });

});

// =======================
// ROUTES
// =======================
app.get("/", (req, res) => {
    res.send("BestieTalks Backend Running ❤️");
});

app.get("/messages", async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

// =======================
// SERVER START
// =======================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});