import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";

import "./App.css";
import Login from "./Login";

import EmojiPicker from "emoji-picker-react";

const socket = io("http://bestietalks-server.onrender.com/");

function App() {

  const [user, setUser] = useState("");

  const [message, setMessage] = useState("");

  const [chat, setChat] = useState([]);

  const [onlineStatus, setOnlineStatus] = useState("");

  const [typingStatus, setTypingStatus] = useState("");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);

  // Load old messages
  useEffect(() => {

    fetchMessages();

  }, []);

  const fetchMessages = async () => {

    try {

      const response = await axios.get(
        "http://bestietalks-server.onrender.com/messages"
      );

      setChat(response.data);

    } catch (error) {

      console.log(error);

    }

  };

  // Receive live messages
  useEffect(() => {

    socket.on("receive_message", (data) => {

      setChat((prev) => [...prev, data]);

    });

    return () => {

      socket.off("receive_message");

    };

  }, []);

  // Online status
  useEffect(() => {

    socket.on("online_users", (data) => {

      if (data.user !== user) {

        if (data.status === "online") {

          setOnlineStatus(`${data.user} is Online 🟢`);

        } else {

          setOnlineStatus(`${data.user} is Offline ⚫`);

        }

      }

    });

    return () => {

      socket.off("online_users");

    };

  }, [user]);

  // Typing listener
  useEffect(() => {

    socket.on("show_typing", (data) => {

      setTypingStatus(data);

    });

    socket.on("hide_typing", () => {

      setTypingStatus("");

    });

    return () => {

      socket.off("show_typing");
      socket.off("hide_typing");

    };

  }, []);

  // User online
  useEffect(() => {

    if (user) {

      socket.emit("user_online", user);

    }

  }, [user]);

  // Emoji Click
  const handleEmojiClick = (emojiData) => {

    setMessage((prev) =>
      prev + emojiData.emoji
    );

  };

  // Time
  const getCurrentTime = () => {

    const now = new Date();

    return now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

  };

  // Send Message
  const sendMessage = () => {

    if (message.trim() === "") {
      return;
    }

    const newMessage = {
      text: message,
      sender: user,
      time: getCurrentTime()
    };

    socket.emit("send_message", newMessage);

    socket.emit("stop_typing");

    setMessage("");

  };

  // Typing
  const handleTyping = (e) => {

    setMessage(e.target.value);

    socket.emit("typing", user);

    setTimeout(() => {

      socket.emit("stop_typing");

    }, 1000);

  };

  // Auto Scroll
  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [chat]);

  // Enter Send
  const handleKeyPress = (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

      e.preventDefault();

      sendMessage();

    }

  };

  // Login Page
  if (!user) {

    return <Login setUser={setUser} />;

  }

  return (
    <div className="app">

      <div className="chat-container">

        <div className="chat-header">

          <h3>
            {user} ❤️
          </h3>

          <p>
            {onlineStatus}
          </p>

        </div>

        <div className="chat-messages">

          {typingStatus && (

            <div className="typing-box">
              {typingStatus}
            </div>

          )}

          {chat.map((msg, index) => (

            <div
              key={index}
              className={
                msg.sender === user
                  ? "message sent"
                  : "message received"
              }
            >

              <p>{msg.text}</p>

              <span className="time">
                {msg.time}
              </span>

            </div>

          ))}

          <div ref={messagesEndRef}></div>

        </div>

        {showEmojiPicker && (

          <div className="emoji-picker">

            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="dark"
            />

          </div>

        )}

        <div className="chat-input">

          <button
            className="emoji-btn"
            onClick={() =>
              setShowEmojiPicker(!showEmojiPicker)
            }
          >
            😀
          </button>

          <textarea
            placeholder="Type a message"
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
            rows="1"
          />

          <button onClick={sendMessage}>
            ➤
          </button>

        </div>

      </div>

    </div>
  );
}

export default App;