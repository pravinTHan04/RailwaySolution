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

    // Listen for login/logout changes
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
    // you can create /profile page later
    alert(
      `Profile\n\nName: ${displayName}\nEmail: ${user?.email || "N/A"}\nRole: ${
        user?.role || "N/A"
      }`
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-updated"));
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="p-4 flex items-center justify-between border-b bg-white/80 backdrop-blur">
      <div className="flex gap-4">
        <Link to="/schedule" className="hover:underline">
          Schedule
        </Link>
        <Link to="/search" className="hover:underline">
          Search
        </Link>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((x) => !x)}
          className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100"
        >
          <span className="text-sm text-gray-700 hidden sm:inline">
            {displayName}
          </span>
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg text-sm z-20">
            <div className="px-3 py-2 border-b">
              <div className="font-semibold">{displayName}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
              <div className="text-[11px] text-gray-400">
                Role: {user?.role ?? "N/A"}
              </div>
            </div>

            <button
              onClick={handleProfileClick}
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
            >
              View profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
