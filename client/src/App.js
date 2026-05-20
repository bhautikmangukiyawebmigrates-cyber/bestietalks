import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./App.css";
import Login from "./Login";
import EmojiPicker from "emoji-picker-react";

// ================= SOCKET =================

const socket = io(
  "https://bestietalks-server.onrender.com",
  {
    transports: ["websocket", "polling"],
  }
);

function App() {

  // ================= REFS =================

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ================= STATES =================

  const [user, setUser] = useState("");

  const [message, setMessage] = useState("");

  const [chat, setChat] = useState([]);

  const [onlineStatus, setOnlineStatus] =
    useState("");

  const [typingStatus, setTypingStatus] =
    useState("");

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  // ================= LOAD OLD MESSAGES =================

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

  // ================= RECEIVE MESSAGE =================

  useEffect(() => {

    const receiveHandler = (data) => {

      setChat((prev) => [...prev, data]);

    };

    socket.on(
      "receive_message",
      receiveHandler
    );

    return () => {

      socket.off(
        "receive_message",
        receiveHandler
      );

    };

  }, []);

  // ================= ONLINE STATUS =================

  useEffect(() => {

    const onlineHandler = (data) => {

      if (data.user !== user) {

        setOnlineStatus(

          data.status === "online"
            ? `${data.user} is Online 🟢`
            : `${data.user} is Offline ⚫`

        );

      }
    };

    socket.on(
      "online_users",
      onlineHandler
    );

    return () => {

      socket.off(
        "online_users",
        onlineHandler
      );

    };

  }, [user]);

  // ================= TYPING STATUS =================

  useEffect(() => {

    socket.on(
      "show_typing",
      setTypingStatus
    );

    socket.on(
      "hide_typing",
      () => setTypingStatus("")
    );

    return () => {

      socket.off("show_typing");
      socket.off("hide_typing");

    };

  }, []);

  // ================= USER ONLINE =================

  useEffect(() => {

    if (user) {

      socket.emit(
        "user_online",
        user
      );

    }

  }, [user]);

  // ================= AUTO SCROLL =================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [chat]);

  // ================= CURRENT TIME =================

  const getCurrentTime = () => {

    return new Date().toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };

  // ================= SEND MESSAGE =================

  const sendMessage = () => {

    if (!message.trim()) return;

    const newMessage = {

      text: message,

      sender: user,

      time: getCurrentTime(),

    };

    // SEND TO SERVER

    socket.emit(
      "send_message",
      newMessage
    );

    socket.emit("stop_typing");

    // CLEAR INPUT

    setMessage("");

    setShowEmojiPicker(false);

    // RESET HEIGHT

    if (inputRef.current) {

      inputRef.current.style.height =
        "44px";

    }

    // KEEP FOCUS

    setTimeout(() => {

      inputRef.current?.focus();

    }, 50);
  };

  // ================= HANDLE TYPING =================

  const handleTyping = (e) => {

    setMessage(e.target.value);

    socket.emit("typing", user);

    // AUTO HEIGHT

    e.target.style.height = "auto";

    e.target.style.height =
      Math.min(
        e.target.scrollHeight,
        120
      ) + "px";

    // STOP TYPING

    clearTimeout(window.typingTimer);

    window.typingTimer = setTimeout(() => {

      socket.emit("stop_typing");

    }, 800);
  };

  // ================= ENTER SEND =================

  const handleKeyPress = (e) => {

    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {

      e.preventDefault();

      sendMessage();

    }
  };

  // ================= EMOJI =================

  const handleEmojiClick = (
    emojiData
  ) => {

    setMessage(
      (prev) =>
        prev + emojiData.emoji
    );

    inputRef.current?.focus();
  };

  // ================= LOGIN PAGE =================

  if (!user) {

    return (
      <Login setUser={setUser} />
    );

  }

  // ================= MAIN UI =================

  return (

    <div className="app">

      <div className="chat-container">

        {/* ================= HEADER ================= */}

        <div className="chat-header">

          <div className="header-user">

            {/* AVATAR */}

            <div className="avatar online">

              {user
                .charAt(0)
                .toUpperCase()}

            </div>

            {/* USER INFO */}

            <div>

              <h3>
                {user} ❤️
              </h3>

              <p>
                {onlineStatus ||
                  "Online"}
              </p>

            </div>

          </div>

        </div>

        {/* ================= CHAT AREA ================= */}

        <div className="chat-messages">

          {/* TYPING */}

          {typingStatus && (

            <div className="typing-box">

              {typingStatus}

            </div>

          )}

          {/* MESSAGES */}

          {chat.map((msg, i) => (

            <div
              key={i}
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

          {/* AUTO SCROLL */}

          <div ref={messagesEndRef} />

        </div>

        {/* ================= EMOJI PICKER ================= */}

        {showEmojiPicker && (

          <div className="emoji-picker">

            <EmojiPicker
              onEmojiClick={
                handleEmojiClick
              }
              theme="dark"
            />

          </div>

        )}

        {/* ================= INPUT AREA ================= */}

        <div className="chat-input">

          {/* EMOJI BUTTON */}

          <button
            className="emoji-btn"
            onClick={() =>
              setShowEmojiPicker(
                !showEmojiPicker
              )
            }
          >

            😊

          </button>

          {/* INPUT WRAPPER */}

          <div className="chat-input-wrapper">

            <textarea
              ref={inputRef}
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
              onKeyDown={handleKeyPress}
              rows="1"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck="true"
            />

          </div>

          {/* SEND BUTTON */}

          <button
            className="send-btn"
            onClick={sendMessage}
          >

            ➤

          </button>

        </div>

      </div>

    </div>
  );
}

export default App;