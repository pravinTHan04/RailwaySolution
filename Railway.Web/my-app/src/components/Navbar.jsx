import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide navbar on auth pages
  const hideNav = location.pathname === "/" || location.pathname === "/signup";

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem("user");
      if (!stored) {
        setUser(null);
        return;
      }
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    };

    loadUser();

    const handler = () => loadUser();
    window.addEventListener("auth-updated", handler);
    return () => window.removeEventListener("auth-updated", handler);
  }, []);

  if (hideNav) return null;

  const displayName =
    user?.firstname ||
    user?.lastname ||
    (user?.email ? user.email.split("@")[0] : "User");

  const initials =
    (user?.firstname?.[0] || user?.email?.[0] || "U").toUpperCase();

  const handleProfileClick = () => {
    setMenuOpen(false);
    navigate("/profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-updated"));
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="w-full px-4 py-3 border-b bg-white/80 backdrop-blur-md flex items-center justify-between shadow-sm">
      
      {/* Left Nav Items */}
      <div className="flex gap-6 text-gray-700 text-sm">
        <Link to="/schedule" className="hover:text-black transition">
          Schedule
        </Link>
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((x) => !x)}
          className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition"
        >
          <span className="text-sm text-gray-700 hidden sm:inline">
            {displayName}
          </span>

          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium shadow-sm">
            {initials}
          </div>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-2 animate-fade-in">
            
            <div className="px-4 py-2 border-b">
              <div className="font-medium text-gray-900">{displayName}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
              <div className="text-[11px] text-gray-400">
                Role: {user?.role ?? "N/A"}
              </div>
            </div>

            <button
              onClick={handleProfileClick}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition"
            >
              View Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              Sign Out
            </button>

          </div>
        )}
      </div>
    </nav>
  );
}
