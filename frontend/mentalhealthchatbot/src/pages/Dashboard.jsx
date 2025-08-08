import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch {
        navigate("/login");
      }
    };
    fetchUser();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      {user ? (
        <h2 className="text-2xl font-bold">
          Welcome, {user.name}! 🎉
        </h2>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Dashboard;
