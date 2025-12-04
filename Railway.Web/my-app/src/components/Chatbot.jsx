import { useState, useRef } from "react";
import { sendChatMessage } from "../api/aiChat";
import api from "../api/axios";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | selecting | seat | name | email
  const selectedTrain = useRef(null);
  const availableSeatsRef = useRef([]); // flattened available seats for current train

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  // -----------------------------------------------------
  // 🔥 Fetch available seats for selected train
  // -----------------------------------------------------
  async function fetchSeatsForTrain(scheduleId, fromStopOrder, toStopOrder) {
    try {
      console.log("🔍 Fetching seats for schedule:", scheduleId, {
        fromStopOrder,
        toStopOrder,
      });

      const res = await api.get("/api/seats/available", {
        params: {
          scheduleId,
          fromStopOrder,
          toStopOrder,
        },
      });

      console.log("🎉 /api/seats/available result:", res.data);

      return res.data; // [{ carriage, seats: [{ seatId, seatNumber, status }, ...] }, ...]
    } catch (err) {
      console.error("❌ Seat fetch error:", err);
      return null;
    }
  }

  // -----------------------------------------------------
  // 🔥 TRAIN SELECT HANDLER
  // -----------------------------------------------------
  async function selectTrain(train) {
    console.log("🚆 User selected train object:", train);

    // 🧠 IMPORTANT:
    // I'm assuming your AI/ schedule DTO includes "fromOrder" & "toOrder",
    // because your BookingPage uses "fromOrder" & "toOrder" in the URL.
    // If your console shows different property names (e.g. fromStop, toStop),
    // adjust these two lines accordingly.
    const fromStopOrder =
      train.fromOrder ?? train.fromStopOrder ?? train.from ?? 1;
    const toStopOrder =
      train.toOrder ?? train.toStopOrder ?? train.to ?? fromStopOrder + 1;

    selectedTrain.current = {
      ...train,
      fromStopOrder,
      toStopOrder,
    };

    console.log("📌 Selected train with stops:", selectedTrain.current);

    // Fetch seats from backend
    const seatData = await fetchSeatsForTrain(
      selectedTrain.current.scheduleId,
      fromStopOrder,
      toStopOrder
    );

    if (!seatData || seatData.length === 0) {
      console.warn("⚠ No seats returned from API for this train.");
      availableSeatsRef.current = [];
    } else {
      // Flatten all available seats from all carriages
      const flatAvailable = seatData.flatMap((car) =>
        car.seats.filter((s) => s.status === "available")
      );

      console.log("🪑 Flattened available seats:", flatAvailable);
      availableSeatsRef.current = flatAvailable;
    }

    setMode("seat");

    addMessage({
      sender: "ai",
      text: `You selected: ${train.train}.\nHow many seats do you need?`,
    });
  }

  // -----------------------------------------------------
  // 🔥 MAIN SEND HANDLER
  // -----------------------------------------------------
  async function handleSend() {
    const userMsg = question.trim();
    if (!userMsg || loading) return;

    addMessage({ sender: "user", text: userMsg });
    setQuestion("");
    setLoading(true);

    console.log("📩 User typed:", userMsg);
    console.log("🎯 Mode:", mode);

    try {
      // --------------------------------------------
      // STEP 2 – seat count
      // --------------------------------------------
      if (mode === "seat") {
        const count = parseInt(userMsg);
        if (isNaN(count) || count <= 0) {
          addMessage({ sender: "ai", text: "Enter a valid number of seats." });
          return;
        }

        selectedTrain.current.seatCount = count;
        console.log("✅ Seat count saved:", count);

        setMode("name");
        addMessage({ sender: "ai", text: "Great — what's the passenger name?" });
        return;
      }

      // --------------------------------------------
      // STEP 3 – passenger name
      // --------------------------------------------
      if (mode === "name") {
        selectedTrain.current.name = userMsg;
        console.log("✅ Passenger name saved:", userMsg);

        setMode("email");
        addMessage({ sender: "ai", text: "Perfect — now enter email address." });
        return;
      }

      // --------------------------------------------
      // STEP 4 – email + REAL booking
      // --------------------------------------------
      if (mode === "email") {
        selectedTrain.current.email = userMsg;
        console.log("✅ Email saved:", userMsg);

        addMessage({
          sender: "ai",
          text: "Booking your ticket... please wait ⏳",
        });

        try {
          console.log("🛤 Final selectedTrain object:", selectedTrain.current);
          console.log("🪑 Available seats in memory:", availableSeatsRef.current);

          if (!selectedTrain.current.scheduleId) {
            throw new Error("scheduleId is missing in selectedTrain.current");
          }

          if (!availableSeatsRef.current.length) {
            throw new Error("No available seats cached for this train.");
          }

          // For now: ignore seatCount, just pick the first available seat
          const firstSeat = availableSeatsRef.current[0];
          console.log("🎯 Using seat for booking:", firstSeat);

          const payload = {
            scheduleId: selectedTrain.current.scheduleId,
            passengerName: selectedTrain.current.name,
            seatIds: [firstSeat.seatId],
            fromStopOrder: selectedTrain.current.fromStopOrder,
            toStopOrder: selectedTrain.current.toStopOrder,
          };

          console.log("📦 Booking payload:", payload);

          // 1️⃣ Create pending booking
          const createRes = await api.post("/api/booking/create", payload);
          console.log("🟢 /api/booking/create response:", createRes.data);

          const booking = createRes.data;
          const bookingId = booking.id || booking.Id;
          console.log("🔑 bookingId:", bookingId);

          
await api.post("/api/booking/passengers", {
  bookingId,
  passengers: [
    {
      fullName: selectedTrain.current.name,
      email: selectedTrain.current.email,
    }
  ]
});
console.log("📨 Saving passenger details...");

          // 2️⃣ Confirm booking (generates QR + email)
          const confirmRes = await api.post(`/api/booking/confirm/${bookingId}`);
          console.log("🟢 /api/booking/confirm response:", confirmRes.data);
// 3️⃣ Save passenger details (REQUIRED for email)


console.log("📨 Passenger info saved!");

          addMessage({
            sender: "ai",
            text: `🎟 Ticket Confirmed!\nBooking ID: ${bookingId}\nYou should receive an email with your ticket.`,
          });

          setMode("idle");
        } catch (error) {
          console.error("❌ Booking error:", error);
          addMessage({
            sender: "ai",
            text: "❌ Booking failed on server. Check console logs.",
          });
        }

        return;
      }

      // --------------------------------------------
      // NORMAL MODE – ask AI for trains
      // --------------------------------------------
      const reply = await sendChatMessage(userMsg);
      console.log("🤖 AI reply:", reply);

      if (reply?.schedules?.length > 0) {
        console.log("🛤 AI schedules:", reply.schedules);
        setMode("selecting");

        addMessage({
          sender: "ai",
          text: `I found ${reply.schedules.length} train(s). Choose one to continue 🚆`,
        });

        addMessage({
          sender: "ai",
          type: "train-list",
          data: reply.schedules,
        });

        return;
      }

      addMessage({
        sender: "ai",
        text: reply?.ai || "I couldn't find anything. Try another query.",
      });
    } catch (err) {
      console.error("🚨 Chat error:", err);
      addMessage({ sender: "ai", text: "⚠️ Communication error." });
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  return (
    <div>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 w-80 bg-white shadow-xl border rounded-xl flex flex-col text-sm">
          {/* Header */}
          <div className="p-3 border-b font-bold bg-blue-600 text-white flex justify-between items-center">
            <span>Railway Assistant</span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="p-3 h-64 overflow-y-auto space-y-2">
            {messages.map((m, i) => {
              if (m.type === "train-list" && Array.isArray(m.data)) {
                return (
                  <div key={i} className="bg-gray-100 p-2 rounded-md">
                    {m.data.map((train) => (
                      <button
                        key={train.scheduleId}
                        onClick={() => selectTrain(train)}
                        className="block w-full bg-blue-600 text-white px-2 py-2 rounded-md mb-2 hover:bg-blue-700 text-left"
                      >
                        <div className="font-semibold">{train.train}</div>
                        <div className="text-xs">
                          {new Date(train.departure).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={`p-2 rounded-md max-w-[90%] ${
                    m.sender === "user"
                      ? "bg-blue-100 ml-auto text-right"
                      : "bg-gray-200 mr-auto"
                  }`}
                >
                  {m.text}
                </div>
              );
            })}

            {loading && (
              <div className="text-gray-500 text-xs">Thinking...</div>
            )}

            {!loading && messages.length === 0 && (
              <div className="text-gray-500 text-xs">
                Try: "Train from Colombo Fort to Matara tomorrow"
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask something..."
              className="flex-1 border rounded px-2 py-1 text-xs"
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
              disabled={loading}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
