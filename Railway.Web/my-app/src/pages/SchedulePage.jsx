import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import ChatBot from "../components/Chatbot.jsx"; // <-- IMPORT YOUR CHATBOT

export default function SchedulePage() {
  const navigate = useNavigate();

  const [stations, setStations] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [manualResults, setManualResults] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [time, setTime] = useState("");


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

  async function searchManual() {
    if (!from || !to || !date) {
      alert("Please select From, To, and Date.");
      return;
    }

    setManualLoading(true);
    setManualResults([]);

    try {
      const res = await api.get("/api/schedules/search", {
        params: { from, to, date },
      });
      setManualResults(res.data);
    } catch {
      alert("Manual search failed.");
    }

    setManualLoading(false);
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* LEFT PANEL: SEARCH */}
      <div className="p-4 bg-gray-100 border rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Manual Search 🔍</h2>

        <div className="space-y-3">
          <select
            className="border rounded-lg p-3 w-full"
            onChange={(e) => setFrom(e.target.value)}
          >
            <option value="">From Station</option>
            {stations
              .filter((st) => st.id !== to)            
              .map((st) => (
                <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg p-3 w-full"
            onChange={(e) => setTo(e.target.value)}
            value={to}
          >
            <option value="">To Station</option>
            {stations
              .filter((st) => st.id !== from)   // <--- THE IMPORTANT PART
              .map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
          </select>


          <input
            type="date"
            className="border rounded-lg p-3 w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <button
            onClick={searchManual}
            className="bg-green-600 text-white px-5 py-2 rounded-lg w-full"
          >
            Search →
          </button>
        </div>

        {manualResults.length > 0 && (
          <div className="mt-4 space-y-3">
            <h3 className="font-semibold">Results:</h3>

            {manualResults.map((trip) => (
              <div
                key={trip.id}
                className="p-4 border rounded-lg bg-white hover:bg-gray-200 cursor-pointer"
              >
                <p className="font-bold">{trip.train.name}</p>
                <p>{trip.route.name}</p>

                <p>
                  Departure:{" "}
                  {new Date(trip.departureTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <button
                  className="mt-2 w-full bg-blue-600 text-white py-1 rounded"
                  onClick={() =>
                    navigate(
                      `/book?scheduleId=${trip.id}&fromOrder=${trip.fromStopOrder}&toOrder=${trip.toStopOrder}`
                    )
                  }
                >
                  Book →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

{/* RIGHT PANEL: CHATBOT */}
      <div className="p-4 bg-white border rounded-xl shadow h-[600px] overflow-hidden flex flex-col">
        <ChatBot />
      </div>

    </div>
  );
}
