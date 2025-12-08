export default function ProfilePage() {
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  if (!user) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="p-4 bg-red-100 border border-red-300 rounded">
          ⚠️ No user data found. Please login.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="p-5 bg-white border rounded-xl shadow space-y-3">
        <div>
          <span className="font-semibold">First Name:</span> {user.firstname || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Last Name:</span> {user.lastname || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Email:</span> {user.email || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Role:</span> {user.role || "N/A"}
        </div>
      </div>

      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
      >
        ← Back
      </button>
    </div>
  );
}
