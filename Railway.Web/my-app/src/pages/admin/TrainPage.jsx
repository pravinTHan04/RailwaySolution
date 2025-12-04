import { useEffect, useState } from "react";
import api from "../../api/axios";
import useAuth from "../../auth/useAuth";

export default function TrainsPage() {
  const { isAdmin } = useAuth();
  const [trains, setTrains] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trainTypes, setTrainTypes] = useState([]);
  const [trainTypeId, setTrainTypeId] = useState("");


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
    console.error("Failed to load train types", err);
  }
}

useEffect(() => {
  load();
  loadTrainTypes();
}, []);


async function addTrain() {
  if (!name.trim()) {
    alert("Train name is required.");
    return;
  }

  if (!trainTypeId) {
    alert("Please select a train type.");
    return;
  }

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

  useEffect(() => { load(); }, []);

  if (!isAdmin) {
    return <div className="text-red-600 text-lg font-semibold">🚫 Access denied — Admins only.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">🚆 Train Management</h1>

      {/* Add Train Input */}
      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 rounded w-64"
          placeholder="Train Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={addTrain}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Train
        </button>
      </div>
      <div>
        <select
  className="border p-2 rounded w-64"
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

      {/* Loading or Error */}
      {loading && <p>Loading trains...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Train Table */}
      {!loading && trains.length === 0 && (
        <p className="text-gray-500">No trains found.</p>
      )}

      {trains.length > 0 && (
        <table className="w-full bg-white shadow border">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Train Name</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {trains.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.name}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => deleteTrain(t.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
