import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function SchedulePage() {
  const navigate = useNavigate();

  const [stations, setStations] = useState([]);

  // AI search state
  const [query, setQuery] = useState("");
  const [aiResults, setAiResults] = useState([]);

  // Manual search
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load station list
  useEffect(() => {
    loadStations();
  }, []);

  async function loadStations() {
    try {
      const res = await api.get("/api/stations");
      setStations(res.data);
    } catch (err) {
      console.error("Station load failed", err);
    }
  }

  // AI Search
  async function handleAISearch() {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await api.post("/api/ai/ask", { question: query });
      setAiResults(res.data.schedules || []);
    } catch (err) {
      alert("AI Search failed.");
    }
    setLoading(false);
  }

  // Manual search
  async function searchSchedules() {
    if (!from || !to || !date) {
      alert("Please select From, To, and Date.");
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const res = await api.get("/api/schedules/search", {
        params: { from, to, date }
      });
      setResults(res.data);
    } catch (err) {
      alert("Search failed — backend might be missing endpoint.");
    }
    setLoading(false);
  }

  const handleSelectAI = (train) => {
  navigate(`/book?scheduleId=${train.scheduleId}&fromOrder=${train.fromStopOrder}&toOrder=${train.toStopOrder}`);
  };

  return (
    <div className="p-6 space-y-8">

      <h1 className="text-3xl font-bold">Find Your Train 🚆</h1>

      {/* --------------------------------------- */}
      {/* AI SMART SEARCH */}
      {/* --------------------------------------- */}
      <div className="p-4 border rounded-xl bg-gray-100 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Smart Search (AI)</h2>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Example: Train from Colombo to Jaffna at 7pm"
            className="flex-1 p-3 border rounded-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={handleAISearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Search
          </button>
        </div>

        {aiResults.length > 0 && (
          <div className="mt-3 space-y-3">
            <h3 className="font-medium text-gray-700">AI Suggestions:</h3>
            {loading && <p>Searching...</p>}
            {aiResults.map((train, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg bg-white hover:bg-gray-200 cursor-pointer"
                onClick={() => handleSelectAI(train)}
              >
                <p className="font-bold">{train.train}</p>
                <p>{new Date(train.departure).toLocaleString()}</p>
                <p className="text-sm text-gray-600">Route: {train.route}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --------------------------------------- */}
      {/* MANUAL SEARCH */}
      {/* --------------------------------------- */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Search Manually</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            className="border rounded-lg p-3"
            onChange={(e) => setFrom(e.target.value)}
          >
            <option value="">From Station</option>
            {stations.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
          </select>

          <select
            className="border rounded-lg p-3"
            onChange={(e) => setTo(e.target.value)}
          >
            <option value="">To Station</option>
            {stations.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
          </select>

          <input
            type="date"
            className="border rounded-lg p-3"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <button
          onClick={searchSchedules}
          className="bg-green-600 text-white px-5 py-2 rounded-lg"
        >
          Search →
        </button>
      </div>

      {/* SCHEDULE RESULTS */}
      <div className="space-y-4">
        {results.map((trip) => (
          <div key={trip.id} className="border p-4 rounded-lg shadow bg-white">
            <h2 className="text-lg font-bold">{trip.train.name}</h2>
            <p>{trip.route.name} • {trip.train.trainType?.name}</p>
            <p>
              Departure:{" "}
              {new Date(trip.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit"})}
            </p>
            <button
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded"
              onClick={() => navigate(`/book?scheduleId=${trip.id}&fromOrder=${trip.fromStopOrder}&toOrder=${trip.toStopOrder}`)}
            >
              Book →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
