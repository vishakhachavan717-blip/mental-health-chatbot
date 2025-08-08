import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-purple-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Mental Health Chatbot</h1>
      <div className="space-x-4">
        <Link to="/" className="hover:text-gray-200">
          Home
        </Link>
        <Link to="/signup" className="hover:text-gray-200">
          Signup
        </Link>
        <Link to="/login" className="hover:text-gray-200">
          Login
        </Link>
        <Link to="/dashboard" className="hover:text-gray-200">
          Dashboard
        </Link>
        <Link to="/mood" className="hover:text-gray-200">
          Mood
        </Link>
        <Link to="/analytics" className="hover:text-gray-200">
          Analytics
        </Link>
        <Link to="/chat" className="hover:text-gray-200"> {/* ✅ New Chat Link */}
          Chat
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
