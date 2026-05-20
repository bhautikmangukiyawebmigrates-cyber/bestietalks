import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./App.css";
import Login from "./Login";
import EmojiPicker from "emoji-picker-react";

// ================= SOCKET =================
const socket = io("https://bestietalks-server.onrender.com", {
  transports: ["websocket", "polling"],
});

function App() {
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [user, setUser] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState("");
  const [typingStatus, setTypingStatus] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ================= LOAD MESSAGES =================
  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        "https://bestietalks-server.onrender.com/messages"
      );
      setChat(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= RECEIVE MESSAGES =================
  useEffect(() => {
    const handler = (data) => {
      setChat((prev) => [...prev, data]);
    };

    socket.on("receive_message", handler);

    return () => socket.off("receive_message", handler);
  }, []);

  // ================= ONLINE STATUS =================
  useEffect(() => {
    const handler = (data) => {
      if (data.user !== user) {
        setOnlineStatus(
          data.status === "online"
            ? `${data.user} is Online 🟢`
            : `${data.user} is Offline ⚫`
        );
      }
    };

    socket.on("online_users", handler);

    return () => socket.off("online_users", handler);
  }, [user]);

  // ================= TYPING =================
  useEffect(() => {
    socket.on("show_typing", setTypingStatus);
    socket.on("hide_typing", () => setTypingStatus(""));

    return () => {
      socket.off("show_typing");
      socket.off("hide_typing");
    };
  }, []);

  // ================= USER ONLINE =================
  useEffect(() => {
    if (user) socket.emit("user_online", user);
  }, [user]);

  // ================= TIME =================
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ================= SEND MESSAGE =================
  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      text: message,
      sender: user,
      time: getCurrentTime(),
    };

    socket.emit("send_message", newMessage);
    socket.emit("stop_typing");

    setMessage("");
    setShowEmojiPicker(false);

    // ✅ KEEP KEYBOARD OPEN
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // ================= TYPING =================
  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", user);

    // auto textarea grow
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";

    clearTimeout(window.typingTimer);
    window.typingTimer = setTimeout(() => {
      socket.emit("stop_typing");
    }, 800);
  };

  // ================= EMOJI =================
  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  // ================= AUTO SCROLL =================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ================= ENTER SEND =================
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ================= LOGIN =================
  if (!user) return <Login setUser={setUser} />;

  return (
    <div className="app">
      <div className="chat-container">

        {/* HEADER */}
        <div className="chat-header">
          <h3>{user} ❤️</h3>
          <p>{onlineStatus}</p>
        </div>

        {/* CHAT */}
        <div className="chat-messages">
          {typingStatus && (
            <div className="typing-box">{typingStatus}</div>
          )}

          {chat.map((msg, i) => (
            <div
              key={i}
              className={
                msg.sender === user ? "message sent" : "message received"
              }
            >
              <p>{msg.text}</p>
              <span className="time">{msg.time}</span>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* EMOJI */}
        {showEmojiPicker && (
          <div className="emoji-picker">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="dark"
            />
          </div>
        )}

        {/* INPUT */}
        <div className="chat-input">

          <button
            className="emoji-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😀
          </button>

          <textarea
            ref={inputRef}
            placeholder="Type a message"
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
            rows="1"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck="true"
          />

          <button onClick={sendMessage}>➤</button>

        </div>

      </div>
    </div>
  );
}

export default App;