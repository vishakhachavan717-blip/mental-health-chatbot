
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Mood from "./pages/Mood";
import Analytics from "./pages/Analytics";
import Chat from "./pages/Chat"; // ✅ Import new Chat page

function App() {
  return (
    <div>
      <Navbar />
      <div className="p-6">
        <Routes>
          <Route path="/" element={<h1 className="text-3xl font-bold">Home Page 🏠</h1>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/chat" element={<Chat />} /> {/* ✅ New Chat Route */}
        </Routes>
      </div>
    </div>
  );
}

export default App;
