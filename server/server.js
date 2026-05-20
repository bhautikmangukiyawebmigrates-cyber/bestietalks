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

// Socket.IO Setup
const io = new Server(server, {

    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }

});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)

    .then(() => {

        console.log("MongoDB Connected ✅");

    })

    .catch((error) => {

        console.log(error);

    });

// Socket Connection
io.on("connection", (socket) => {

    console.log("User Connected 🔥");

    // User Online
    socket.on("user_online", (username) => {

        socket.username = username;

        io.emit("online_users", {
            user: username,
            status: "online"
        });

    });

    // Typing Event
    socket.on("typing", (username) => {

        socket.broadcast.emit(
            "show_typing",
            `${username} is typing...`
        );

    });

    // Stop Typing
    socket.on("stop_typing", () => {

        socket.broadcast.emit(
            "hide_typing"
        );

    });

    // Send Message
    socket.on("send_message", async (data) => {

        try {

            const newMessage = new Message(data);

            await newMessage.save();

            io.emit("receive_message", newMessage);

        } catch (error) {

            console.log(error);

        }

    });

    // Disconnect
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

// Home Route
app.get("/", (req, res) => {

    res.send("BestieTalks Backend Running ❤️");

});

// Get Messages
app.get("/messages", async (req, res) => {

    try {

        const messages = await Message.find();

        res.json(messages);

    } catch (error) {

        console.log(error);

    }

});

// Server Port
const PORT = 5000;

server.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});