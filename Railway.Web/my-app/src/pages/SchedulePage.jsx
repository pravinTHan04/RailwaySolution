import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { sendChatMessage } from "../api/aiChat";
import { useNavigate } from "react-router-dom";

export default function SchedulePage() {
  const navigate = useNavigate();

  // Manual search
  const [stations, setStations] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const [manualResults, setManualResults] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);

  // AI assistant state
  const [chatMessages, setChatMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [mode, setMode] = useState("idle"); // seat | name | email | idle
  const selectedTrain = useRef(null);
  const availableSeatsRef = useRef([]);

  const addChat = (m) =>
    setChatMessages((prev) => [...prev, m]);

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

  // MANUAL SEARCH
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
    } catch (err) {
      alert("Manual search failed.");
    }

    setManualLoading(false);
  }

  // AI ASSISTANT LOGIC
  async function handleAIMessage() {
    if (!aiInput.trim() || aiLoading) return;

    const userText = aiInput.trim();
    setAiInput("");

    addChat({ sender: "user", text: userText });
    setAiLoading(true);

    try {
      const reply = await sendChatMessage(userText);
      console.log("🤖 AI reply:", reply);

if (reply?.recommended) {
  setMode("selecting");

  addChat({
    sender: "ai",
    text: reply.ai || "Here are the best options:",
  });

  const { personalized, fastest, cheapest, luxury } = reply.recommended;

  const others = [fastest, cheapest, luxury]
    .filter(Boolean)
    .filter(t => !personalized || t.scheduleId !== personalized.scheduleId);

  addChat({
    sender: "ai",
    type: "train-list",
    data: {
      personalized,
      others
    }
  });

  setAiLoading(false);
  return;
}


      // Normal AI message
      addChat({ sender: "ai", text: reply.ai });
    } catch (err) {
      addChat({ sender: "ai", text: "⚠ Error contacting AI." });
    } finally {
      setAiLoading(false);
    }
  }

  // Selecting a train from AI results
  async function handleSelectAI(train) {
    navigate(
      `/book?scheduleId=${train.scheduleId}&fromOrder=${train.fromStopOrder}&toOrder=${train.toStopOrder}`
    );
  }

  // PAGE LAYOUT
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Search Trains 🚆</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ---------------------------------------------------------
           LEFT PANEL — MANUAL SEARCH
        --------------------------------------------------------- */}
        <div className="p-4 bg-gray-100 border rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Manual Search 🔍</h2>

          <div className="space-y-3">
            <select
              className="border rounded-lg p-3 w-full"
              onChange={(e) => setFrom(e.target.value)}
            >
              <option value="">From Station</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>

            <select
              className="border rounded-lg p-3 w-full"
              onChange={(e) => setTo(e.target.value)}
            >
              <option value="">To Station</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
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

          {/* Manual Results */}
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

        {/* ---------------------------------------------------------
           RIGHT PANEL — AI SMART ASSISTANT
        --------------------------------------------------------- */}
        <div className="p-4 bg-white border rounded-xl shadow flex flex-col">
          <h2 className="text-xl font-bold mb-3">AI Smart Assistant 🤖</h2>

          <div className="flex-1 overflow-y-auto border p-3 rounded bg-gray-50 mb-3">
            {chatMessages.map((m, i) => {
if (m.type === "train-list") {
  const { personalized, others } = m.data;

  return (
    <div key={i} className="space-y-4">

      {personalized && (
        <div className="p-3 border-2 border-red-500 rounded-lg bg-white shadow">
          <div className="text-xs font-bold text-red-600 mb-1">
            ❤️ Based on your past bookings
          </div>

          <button
            key={personalized.scheduleId}
            onClick={() => handleSelectAI(personalized)}
            className="block w-full bg-blue-600 text-white px-3 py-3 rounded-md hover:bg-blue-700 text-left"
          >
            <div className="font-semibold text-base">{personalized.train}</div>
            <div className="text-xs">{new Date(personalized.departure).toLocaleString()}</div>
            <div className="text-xs">Rs. {personalized.price}</div>
            <div className="text-xs">{personalized.travelTime} mins</div>
          </button>
        </div>
      )}

      {others?.map((train) => (
        <button
          key={train.scheduleId}
          onClick={() => handleSelectAI(train)}
          className="block w-full bg-blue-600 text-white px-3 py-3 rounded-md hover:bg-blue-700 text-left"
        >
          {/* Tags */}
          {train.trainType === "Express" && (
            <span className="inline-block mb-1 px-2 py-1 text-xs rounded bg-yellow-400 text-black">
              🚄 Fastest
            </span>
          )}
          {train.trainType === "Local" && (
            <span className="inline-block mb-1 px-2 py-1 text-xs rounded bg-green-400 text-black">
              💸 Cheapest
            </span>
          )}
          {train.trainType === "Luxury" && (
            <span className="inline-block mb-1 px-2 py-1 text-xs rounded bg-purple-500 text-white">
              👑 Luxury
            </span>
          )}

          <div className="font-semibold">{train.train}</div>
          <div className="text-xs">{new Date(train.departure).toLocaleString()}</div>
          <div className="text-xs">Rs. {train.price}</div>
          <div className="text-xs">{train.travelTime} mins</div>
        </button>
      ))}
    </div>
  );
}


              return (
                <div
                  key={i}
                  className={`p-2 rounded-md max-w-[80%] ${
                    m.sender === "user"
                      ? "bg-blue-100 ml-auto text-right"
                      : "bg-gray-200 mr-auto"
                  }`}
                >
                  {m.text}
                </div>
              );
            })}

            {aiLoading && <div className="text-xs text-gray-500">Thinking...</div>}
          </div>

          {/* AI Input */}
          <div className="flex gap-2">
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAIMessage()}
              placeholder="Ask: Train from Colombo to Matara at 8am"
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              onClick={handleAIMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
