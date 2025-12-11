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
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* IMAGE SIDE (retained as requested) */}
        <div className="hidden md:block">
          <img
            src={SignupImage}
            alt="Signup"
            className="w-full h-full object-cover"
          />
        </div>

        {/* FORM SIDE (Apple style) */}
        <div className="p-8 md:p-10">
          <h1 className="text-3xl font-semibold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">
            Book train tickets effortlessly
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">

            {/* FIRST + LAST NAME */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppleInput
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
              <AppleInput
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            {/* PHONE */}
            <AppleInput
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
            />

            {/* EMAIL */}
            <AppleInput
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
            />

            {/* PASSWORD + CONFIRM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppleInput
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />

              <AppleInput
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

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-2xl text-white font-medium text-[15px] transition
                ${loading ? "bg-gray-400" : "bg-black hover:bg-gray-900"}
              `}
            >
              {loading ? "Creating Account…" : "Sign Up"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm mt-8">
            Already have an account?{" "}
            <Link to="/" className="text-blue-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* Apple-like input component */
function AppleInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`
        w-full 
        rounded-xl
        border border-gray-300
        bg-[#fdfdfd]
        px-4 py-3
        text-gray-700
        text-[15px]
        focus:ring-2 focus:ring-black/10
        focus:border-gray-400
        outline-none
        transition
        placeholder-gray-400
        ${className}
      `}
      required
    />
  );
}
