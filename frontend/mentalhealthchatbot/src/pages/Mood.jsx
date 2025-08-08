import { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

function Mood() {
  const { token } = useContext(AuthContext);
  const [moodText, setMoodText] = useState("");
  const [moodScore, setMoodScore] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  // Fetch mood history when page loads
  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/mood/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch (err) {
      setError("Could not fetch mood history");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        "/mood",
        { mood_text: moodText, mood_score: Number(moodScore) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Mood submitted!");
      setMoodText("");
      setMoodScore("");
      fetchHistory(); // refresh history
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add mood");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Track Your Mood 🌸</h2>

      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          placeholder="How do you feel?"
          value={moodText}
          onChange={(e) => setMoodText(e.target.value)}
          className="border p-2 mr-2 rounded"
        />
        <input
          type="number"
          placeholder="Score (1-10)"
          value={moodScore}
          onChange={(e) => setMoodScore(e.target.value)}
          min="1"
          max="10"
          className="border p-2 mr-2 rounded"
        />
        <button className="bg-purple-600 text-white px-4 py-2 rounded">
          Submit
        </button>
      </form>

      <h3 className="text-xl font-semibold">Mood History 📜</h3>
      <ul className="mt-4">
        {history.map((mood) => (
          <li key={mood.id} className="border-b py-2">
            <strong>{mood.mood_text}</strong> (Score: {mood.mood_score}) on{" "}
            {new Date(mood.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Mood;
