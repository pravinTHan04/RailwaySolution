import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";
import useAuth from '../auth/useAuth';

import ArchImage from '../images/9Arch.jpg';
import ColomboTrain from '../images/Colombo_Train.jpg';
import T1 from '../images/T1.jpg';

export default function SigninPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    console.log("📩 Attempting login with:", { email });

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      console.warn("⚠️ Missing email or password");
      return;
    }

    setLoading(true);

    try {
      console.log("🚀 Sending request to /api/Auth/login");
      const response = await api.post("/api/Auth/login", { email, password });

      console.log("📥 Server response:", response);

      const data = response.data;

      if (!data?.token) {
        console.warn("❌ Login response missing token:", data);
        setError("Invalid response from server. Token missing.");
        return;
      }

      console.log("🔐 Token received:", data.token);

login(
  {
    email: data.email,
    firstname: data.firstname,
    lastname: data.lastname,
    phone: data.phone,
    role: data.role
  },
  data.token
);



      console.log("📦 User saved in storage:", JSON.parse(localStorage.getItem("user")));

      if (data.role?.toLowerCase() === "admin") {
        console.log("🛠 Redirecting to admin dashboard...");
        navigate("/admin");
      } else {
        console.log("🎟 Redirecting to search...");
        navigate("/schedule");
      }

    } catch (err) {
      console.error("🚨 Login request failed:", err);

      if (err.response) {
        console.error("❌ Backend responded with error:", err.response.data);
      } else {
        console.error("❌ Network or CORS error:", err.message);
      }

      setError("Invalid email or password.");
    }

    setLoading(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* Background Slides */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full animate-fade">
          <img src={ArchImage} className="w-full h-full object-cover absolute inset-0 opacity-100" />
          <img src={ColomboTrain} className="w-full h-full object-cover absolute inset-0 opacity-0 animate-slide" />
          <img src={T1} className="w-full h-full object-cover absolute inset-0 opacity-0 animate-slide2" />
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60 z-10"></div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-white pt-20">
        <h1 className="text-5xl font-bold mb-2">Smart Railway Booking</h1>
        <p className="text-lg mb-10">Fast, easy, AI-assisted train travel.</p>

        <div className="bg-white text-black rounded-xl shadow-xl w-[420px] p-8">

          <h3 className="text-2xl font-semibold mb-6 text-center">Sign In</h3>

          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded-md text-center mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email Input */}
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="example@gmail.com"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              autoComplete="on"
            />

            {/* Password Input */}
            <label className="block mt-4 mb-1 font-medium">Password</label>
            <input
              type="password"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              autoComplete="off"
            />

            {/* Submit Button */}
            <button
              disabled={loading}
              type="submit"
              className={`w-full mt-6 p-3 rounded-lg transition text-white 
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
              `}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="flex justify-center mt-4">
            <button
              onClick={() => navigate("/signup")}
              className="px-4 py-2 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-md mt-1"
            >
              Sign Up
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
