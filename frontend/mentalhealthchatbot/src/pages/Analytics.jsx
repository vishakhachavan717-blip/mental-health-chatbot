import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

function Analytics() {
  const { token } = useContext(AuthContext);
  const [trendData, setTrendData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch Mood Trend
        const trendRes = await api.get("/analytics/mood-trend", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrendData(trendRes.data);

        // Fetch Mood Summary
        const summaryRes = await api.get("/analytics/mood-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummaryData(summaryRes.data);

      } catch (err) {
        console.error("Error fetching analytics:", err);
      }
    };
    if (token) fetchAnalytics();
  }, [token]);

  const COLORS = ["#4CAF50", "#F44336", "#FFC107"];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-purple-700">
        Mood Analytics 📈
      </h1>

      {/* Line Chart: Mood Trend */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Mood Trend Over Time</h2>
        {trendData.length > 0 ? (
          <LineChart width={600} height={300} data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="average_score" stroke="#8884d8" />
          </LineChart>
        ) : (
          <p>No mood data available yet.</p>
        )}
      </div>

      {/* Pie Chart: Mood Summary */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Mood Summary</h2>
        {summaryData ? (
          <PieChart width={400} height={300}>
            <Pie
              data={[
                { name: "Positive", value: summaryData.positive },
                { name: "Negative", value: summaryData.negative },
                { name: "Neutral", value: summaryData.neutral },
              ]}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {["Positive", "Negative", "Neutral"].map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : (
          <p>No mood summary available yet.</p>
        )}
      </div>
    </div>
  );
}

export default Analytics;
