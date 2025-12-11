import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [name, setName] = useState("");

  async function load() {
    const res = await api.get("/api/stations");
    setStations(res.data);
  }

  async function add() {
    if (!name.trim()) return;
    await api.post("/api/stations", { name });
    setName("");
    load();
  }

  async function deleteStation(id) {
    if (!window.confirm("Are you sure you want to delete this station?")) return;

    try {
      await api.delete(`/api/stations/${id}`);
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete station");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-lg mx-auto">

        {/* HEADER */}
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">
          Stations
        </h1>

        {/* ADD STATION */}
        <div className="bg-white rounded-2xl shadow p-5 mb-8 space-y-4 border border-gray-200">
          <div className="space-y-2">
            <label className="text-gray-700 font-medium text-sm">
              Station Name
            </label>
            <input
              className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Enter station name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button
            onClick={add}
            className="w-full bg-black text-white py-3 rounded-xl 
                       font-semibold hover:bg-gray-900 transition"
          >
            Add Station
          </button>
        </div>

        {/* LIST OF STATIONS */}
        <div className="space-y-3">
          {stations.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200
                         p-4 flex justify-between items-center"
            >
              <span className="text-gray-900 font-medium">{s.name}</span>

              <button
                onClick={() => deleteStation(s.id)}
                className="text-red-600 px-3 py-1 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
