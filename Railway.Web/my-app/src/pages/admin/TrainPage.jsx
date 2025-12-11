import { useEffect, useState } from "react";
import api from "../../api/axios";
import useAuth from "../../auth/useAuth";

export default function TrainsPage() {
  const { isAdmin } = useAuth();

  const [trains, setTrains] = useState([]);
  const [trainTypes, setTrainTypes] = useState([]);

  const [name, setName] = useState("");
  const [trainTypeId, setTrainTypeId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await api.get("/api/trains");
      setTrains(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load trains.");
    }
    setLoading(false);
  }

  async function loadTrainTypes() {
    try {
      const res = await api.get("/api/traintypes");
      setTrainTypes(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    load();
    loadTrainTypes();
  }, []);

  async function addTrain() {
    if (!name.trim()) return alert("Train name is required.");
    if (!trainTypeId) return alert("Select train type.");

    try {
      await api.post("/api/trains", { name, trainTypeId });
      setName("");
      setTrainTypeId("");
      load();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add train.");
    }
  }

  async function deleteTrain(id) {
    if (!window.confirm("Delete this train?")) return;
    try {
      await api.delete(`/api/trains/${id}`);
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete train.");
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-red-600 text-lg font-semibold">
        🚫 Access denied — Admins only.
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-lg mx-auto">

        {/* PAGE HEADER */}
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">
          Train Management
        </h1>

        {/* ADD TRAIN CARD */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 space-y-4 mb-8">

          {/* Train Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Train Name</label>
            <input
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Enter train name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Train Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Train Type</label>
            <select
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-black/10"
              value={trainTypeId}
              onChange={(e) => setTrainTypeId(e.target.value)}
            >
              <option value="">Select Train Type</option>
              {trainTypes.map((tt) => (
                <option key={tt.id} value={tt.id}>
                  {tt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Button */}
          <button
            onClick={addTrain}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold
                       hover:bg-gray-900 transition"
          >
            Add Train
          </button>
        </div>

        {/* ERROR */}
        {error && <p className="text-red-600 mb-3">{error}</p>}

        {/* LIST */}
        <div className="space-y-3">
          {loading ? (
            <p>Loading trains...</p>
          ) : trains.length === 0 ? (
            <p className="text-gray-500">No trains found.</p>
          ) : (
            trains.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200
                           p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                </div>

                <button
                  onClick={() => deleteTrain(t.id)}
                  className="text-red-600 px-3 py-1 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
