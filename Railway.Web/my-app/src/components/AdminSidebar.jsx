import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../auth/useAuth";
export default function AdminSidebar() {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();       // clears auth + localStorage via AuthProvider
    navigate("/");  // go back to login page
  };

  const navItems = [
    { name: "Dashboard", link: "/admin" },
    { name: "Stations", link: "/admin/stations" },
    { name: "Trains", link: "/admin/trains" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col justify-between">
      <div>
        <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

        {navItems.map((item) => (
          <Link
            key={item.link}
            to={item.link}
            className={`block p-2 rounded mb-2 ${
              path === item.link ? "bg-blue-600" : "hover:bg-gray-700"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 py-2 px-4 rounded mt-4"
      >
        Logout
      </button>
    </div>
  );
}
