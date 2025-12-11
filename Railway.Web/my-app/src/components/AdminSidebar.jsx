import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../auth/useAuth";

export default function AdminSidebar() {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { name: "Dashboard", link: "/admin" },
    { name: "Stations", link: "/admin/stations" },
    { name: "Trains", link: "/admin/trains" },
    { name: "Analytics", link: "/admin/analytics" },
  ];

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 p-5 flex flex-col">

      {/* HEADER */}
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Admin Panel
      </h1>

      {/* NAV LIST */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = path === item.link;
          return (
            <Link
              key={item.link}
              to={item.link}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition
                ${active 
                  ? "bg-black text-white" 
                  : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* LOGOUT BUTTON */}
      <button
        onClick={handleLogout}
        className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition"
      >
        Logout
      </button>
    </div>
  );
}
