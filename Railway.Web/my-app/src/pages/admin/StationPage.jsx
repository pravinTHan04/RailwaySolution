import { useEffect, useState } from "react";
import api from "../../api/axios"
export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [name, setName] = useState("");

  async function load() {
    const res = await api.get("/api/stations");
    setStations(res.data);
  }

  async function add() {
    if (!name) return;
    await api.post("/api/stations", { name });
    setName("");
    load();
  }

  async function deleteStation(id) {
  if (!window.confirm("Are you sure you want to delete this station?")) return;

  try {
    await api.delete(`/api/stations/${id}`);
    load(); // refresh the table
  } catch (err) {
    console.error(err);
    alert("Failed to delete station");
  }
}


  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Stations</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 rounded w-64"
          placeholder="Station Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={add} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add
        </button>
      </div>

      <table className="w-full bg-white shadow-sm border">
        <thead className="bg-gray-200 font-semibold">
          <tr>
            <td className="p-2">Name</td>
            <td className="p-2 text-center">Actions</td>
          </tr>
        </thead>

        <tbody>
          {stations.map(s => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2 text-center">
                <button
                  onClick={() => deleteStation(s.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  🗑 Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
