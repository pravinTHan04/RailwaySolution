import useAuth from "../../auth/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-5">

        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Admin Dashboard
        </h1>

        <div className="text-center space-y-1">
          <p className="text-gray-700">
            Logged in as:
          </p>
          <p className="font-medium text-gray-900">
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}
