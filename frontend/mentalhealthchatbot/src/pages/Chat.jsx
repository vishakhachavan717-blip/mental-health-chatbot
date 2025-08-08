import React, { useState, useEffect } from "react";
import api from "../api/axios";

function Chat() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ Added loading state

  // ✅ Fetch chat history on load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/chat/history");
        setChatHistory(res.data);
      } catch (err) {
        setError("Please login again.");
      }
    };
    fetchHistory();
  }, []);

  // ✅ Scroll to bottom when chat history updates
  useEffect(() => {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await api.post("/chat", { message });
      setChatHistory([...chatHistory, { message, response: res.data.response }]);
      setMessage("");
    } catch (err) {
      setError("Failed to send message. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-purple-700">Chat with our AI Bot</h2>

      {/* ✅ Chat History Display */}
      <div
        id="chat-box"
        className="h-64 overflow-y-auto border p-3 mb-4 rounded bg-gray-50"
      >
        {chatHistory.map((chat, idx) => (
          <div key={idx} className="mb-3">
            <div className="text-right">
              <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                <strong>You:</strong> {chat.message}
              </span>
            </div>
            <div className="text-left mt-1">
              <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                <strong>Bot:</strong> {chat.response}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Loading Spinner */}
      {loading && <p className="text-purple-600 mb-2">Typing...</p>}

      {/* ✅ Error Message */}
      {error && <p className="text-red-500 mb-2">{error}</p>}

      {/* ✅ Message Input */}
      <form onSubmit={handleSend} className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          autoFocus
          className="flex-grow border rounded-l px-4 py-2 focus:outline-none focus:ring focus:border-purple-400"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded-r hover:bg-purple-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
