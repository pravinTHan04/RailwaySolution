import useAuth from "../../auth/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-10 text-center">
      <h1 className="text-4xl font-bold text-green-600">
        🎉 Admin Panel Loaded Successfully!
      </h1>

      <p className="mt-4 text-lg text-gray-700">
        Logged in as: <strong>{user?.email}</strong>
      </p>

      <p className="mt-2 text-gray-500">
        If you're seeing this, redirect is working properly.
      </p>
    </div>
  );
}
