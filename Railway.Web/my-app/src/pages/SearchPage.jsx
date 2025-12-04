import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);

    try {
      const res = await axios.post("/api/ai/ask", { question: query });
      setResults(res.data.schedules || []);
    } catch (err) {
      console.error(err);
      alert("Search failed — check backend.");
    }

    setLoading(false);
  };

  const handleSelect = (train) => {
  navigate(`/book?scheduleId=${train.scheduleId}&fromOrder=${train.fromStopOrder}&toOrder=${train.toStopOrder}`);
  };


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Find Your Train</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Example: Train from London to Manchester at 8 AM"
          className="flex-1 p-3 border rounded-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button 
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Search
        </button>
      </div>

      {loading && <p>Searching...</p>}

      <div className="mt-4">
        {results.length === 0 && !loading && <p>No results yet.</p>}

        {results.map((train, idx) => (
          <div 
            key={idx}
            className="p-4 border rounded-lg mb-3 cursor-pointer hover:bg-gray-200"
            onClick={() => handleSelect(train)}
          >
            <p className="font-bold">{train.train}</p>
            <p>{new Date(train.departure).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Route: {train.route}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
