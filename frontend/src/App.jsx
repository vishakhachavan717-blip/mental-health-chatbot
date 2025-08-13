// src/App.jsx
import React, { useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
        alert(json.message || "Logged in successfully!");
      } else {
        alert(json.detail || json.message || JSON.stringify(json));
        console.error("Login error:", json);
      }
    } catch (err) {
      alert("Login failed: " + err.message);
      console.error(err);
    }
  };

  // ---------- SIGNUP ----------
  const signup = async () => {
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const json = await res.json();

      if (res.ok) {
        alert(json.message || "Signup successful! Logging you in...");
        await login(); // Auto login after signup
      } else {
        alert(json.detail || json.message || JSON.stringify(json));
        console.error("Signup error:", json);
      }
    } catch (err) {
      alert("Signup failed: " + err.message);
      console.error(err);
    }
  };

  // ---------- SEND CHAT MESSAGE ----------
  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
      });
      const json = await res.json();
      const botText = json.response || json.message || "No reply";
      setMessages((prev) => [...prev, { sender: "bot", text: botText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error contacting backend" },
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h1>Mental Health Chatbot</h1>

      {!token ? (
        <div style={{ marginBottom: 20 }}>
          <h3>{mode === "login" ? "Login" : "Sign Up"}</h3>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type="password"
          />
          <br />
          <button
            onClick={mode === "login" ? login : signup}
            style={{ marginTop: "10px" }}
          >
            {mode === "login" ? "Login" : "Sign Up"}
          </button>
          <p style={{ marginTop: "10px" }}>
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  style={{ cursor: "pointer" }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  style={{ cursor: "pointer" }}
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
          <button
            onClick={() => {
              localStorage.removeItem("token");
              setToken("");
            }}
          >
            Logout
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "left" }}>
        <div
          style={{
            minHeight: 200,
            border: "1px solid #ddd",
            padding: 10,
            marginBottom: 10,
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
