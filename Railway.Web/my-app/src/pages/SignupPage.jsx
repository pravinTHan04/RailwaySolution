import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SignupImage from "../images/Signup.jpg";
import api from "../api/axios";


export default function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });

  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "confirmPassword") {
      setPasswordMatchError(value !== formData.password);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordMatchError) return;

    setLoading(true);

    try {
      await api.post("api/Auth/register", {
  email: formData.email,
  password: formData.password,
  firstName: formData.firstName,
  lastName: formData.lastName,
  phoneNumber: formData.phone,
  nicNumber: formData.nicNumber
      });


      alert("Account created successfully!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* LEFT IMAGE */}
        <div className="hidden md:block">
          <img
            src={SignupImage}
            alt="Signup"
            className="w-full h-full object-cover"
          />
        </div>

        {/* FORM */}
        <div className="p-8 md:p-10">
          <h1 className="text-3xl font-bold text-gray-800">Create an Account</h1>
          <p className="text-gray-600 mt-1 text-sm">Join and start booking instantly.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />

              <Input 
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <Input 
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
            />

            <Input 
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />

              <Input 
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={passwordMatchError ? "border-red-500" : ""}
              />
            </div>

            {passwordMatchError && (
              <p className="text-red-600 text-sm">❌ Passwords do not match.</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-semibold transition ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/" className="text-blue-600 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Reusable styled input
function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 p-3 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-gray-400 ${className}`}
      required
    />
  );
}
