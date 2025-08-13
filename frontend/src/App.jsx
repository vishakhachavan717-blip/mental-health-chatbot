// src/App.jsx
import React, { useState } from "react";
import "./App.css";

// Make sure this is set in your frontend .env.production as VITE_API_URL
const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [mode, setMode] = useState("signup"); // default to signup so you can create an account
  const [name, setName] = useState("");       // NEW: name for signup (backend requires it)
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- helpers to show readable messages ----------
  const toMessage = (obj) => {
    if (!obj) return "Unknown error";
    // FastAPI validation error usually has detail: [{msg:'...'}, ...]
    if (Array.isArray(obj.detail)) {
      return obj.detail.map((d) => d.msg).join(", ");
    }
    if (typeof obj.detail === "string") return obj.detail;
    if (obj.message) return obj.message;
    try {
      return JSON.stringify(obj);
    } catch {
      return String(obj);
    }
  };

  const showOk = (text) => window.alert(text);
  const showErr = (text) => window.alert(text);

  // ---------- LOGIN ----------
  const login = async () => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const json = await res.json();
      if (res.ok && json.access_token) {
        localStorage.setItem("token", json.access_token);
        setToken(json.access_token);
        showOk("Logged in successfully!");
      } else {
        showErr(`Login failed: ${toMessage(json)}`);
        console.log("LOGIN ERROR:", json);
      }
    } catch (e) {
      showErr(`Login error: ${e.message}`);
      console.error(e);
    }
  };

  // ---------- SIGNUP ----------
  const signup = async () => {
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // IMPORTANT: backend expects name, email, password
        body: JSON.stringify({ name, email, password: pass }),
      });
      const json = await res.json();
      if (res.ok) {
        showOk(json.message || "Signup successful! Logging you in…");
        // Auto login after signup
        await login();
      } else {
        showErr(`Signup failed: ${toMessage(json)}`);
        console.log("SIGNUP ERROR:", json);
      }
    } catch (e) {
      showErr(`Signup error: ${e.message}`);
      console.error(e);
    }
  };

  // ---------- SEND CHAT MESSAGE ----------
  const sendMessage = async () => {
    if (!token) {
      showErr("Please log in first.");
      return;
    }
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userInput }),
      });
      const json = await res.json();
      if (res.ok) {
        const botText = json.response || json.message || "No reply";
        setMessages((prev) => [...prev, { sender: "bot", text: botText }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Error: ${toMessage(json)}` },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: `Error contacting backend: ${err.message}` },
      ]);
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h1>Mental Health Chatbot</h1>

      {!token ? (
        <div style={{ marginBottom: 20 }}>
          <h3>{mode === "login" ? "Login" : "Sign Up"}</h3>

          {mode === "signup" && (
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ display: "block", margin: "8px auto", width: 260 }}
            />
          )}

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", margin: "8px auto", width: 260 }}
          />
          <input
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type="password"
            style={{ display: "block", margin: "8px auto", width: 260 }}
          />
          <button
            onClick={mode === "login" ? login : signup}
            style={{ marginTop: "10px" }}
          >
            {mode === "login" ? "Login" : "Sign Up"}
          </button>

          <p style={{ marginTop: "10px" }}>
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  style={{
                    cursor: "pointer",
                    border: "none",
                    background: "none",
                    color: "#1677ff",
                  }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  style={{
                    cursor: "pointer",
                    border: "none",
                    background: "none",
                    color: "#1677ff",
                  }}
                >
                  Login
                </button>
              </>
            )}
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <div>✅ Logged in</div>
          <button onClick={logout}>Logout</button>
        </div>
      )}

      {/* Chat Area */}
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "left" }}>
        <div
          style={{
            minHeight: 220,
            border: "1px solid #ddd",
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                margin: 6,
                textAlign: m.sender === "user" ? "right" : "left",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: m.sender === "user" ? "#cfe9ff" : "#eee",
                }}
              >
                {m.text}
              </span>
            </div>
          ))}
          {loading && <div>Bot is typing...</div>}
        </div>

        <input
          style={{ width: "70%" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
