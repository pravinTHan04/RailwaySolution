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
    <div className="relative w-full h-screen overflow-hidden">

      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full animate-fade">
          <img src={ArchImage} className="absolute inset-0 w-full h-full object-cover opacity-100" />
          <img src={ColomboTrain} className="absolute inset-0 w-full h-full object-cover opacity-0 animate-slide" />
          <img src={T1} className="absolute inset-0 w-full h-full object-cover opacity-0 animate-slide2" />
        </div>
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-start pt-20 text-white">
        <h1 className="text-5xl font-bold mb-2">Smart Railway Booking</h1>
        <p className="text-lg mb-10">Fast, easy, AI-assisted train travel.</p>

        {/* Sign-in Card */}
        <div className="bg-white text-black w-[420px] p-8 rounded-xl shadow-xl">

          <h3 className="text-2xl font-semibold text-center mb-6">Sign In</h3>

          {error && (
            <div className="mb-4 p-2 text-center bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="example@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                autoComplete="on"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                autoComplete="off"
              />
            </div>

            {/* Sign In Button */}
            <button
              disabled={loading}
              type="submit"
              className={`w-full p-3 rounded-lg text-white transition
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
              `}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {/* Sign Up Link */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="px-4 py-2 mt-1 text-sm font-medium text-gray-800 rounded-md hover:bg-gray-200"
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
