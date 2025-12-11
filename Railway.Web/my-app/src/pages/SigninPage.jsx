import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../auth/useAuth";

import ArchImage from "../images/9Arch.jpg";
import ColomboTrain from "../images/Colombo_Train.jpg";
import T1 from "../images/T1.jpg";

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

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/Auth/login", { email, password });
      const data = response.data;

      if (!data?.token) {
        setError("Invalid response from server. Token missing.");
        return;
      }

      login(
        {
          email: data.email,
          firstname: data.firstname,
          lastname: data.lastname,
          phone: data.phone,
          role: data.role,
        },
        data.token
      );

      if (data.role?.toLowerCase() === "admin") {
        navigate("/admin");
      } else {
        navigate("/schedule");
      }
    } catch (err) {
      setError("Invalid email or password.");
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full">

      {/* Background slideshow */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full animate-fade">
          <img src={ArchImage} className="absolute inset-0 w-full h-full object-cover opacity-100" />
          <img src={ColomboTrain} className="absolute inset-0 w-full h-full object-cover opacity-0 animate-slide" />
          <img src={T1} className="absolute inset-0 w-full h-full object-cover opacity-0 animate-slide2" />
        </div>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col px-4 pt-16 text-white">
        <h1 className="text-3xl font-bold text-center mb-2">Smart Railway Booking</h1>
        <p className="text-center text-sm mb-6">Fast, easy, AI-assisted train travel</p>

        {/* Mobile card */}
        <div className="w-full max-w-sm mx-auto bg-white text-black rounded-2xl shadow-lg p-6">

          <h3 className="text-xl font-semibold text-center mb-4">Sign In</h3>

          {error && (
            <div className="mb-4 p-2 text-center bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="on"
                className="p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                className="p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 rounded-xl text-white font-semibold transition
                ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
              `}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up */}
          <div className="flex justify-center mt-4">
            <button
              className="text-sm text-blue-600 underline"
              onClick={() => navigate("/signup")}
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
