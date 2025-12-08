import { useState, useRef } from "react";
import { sendChatMessage } from "../api/aiChat";
import api from "../api/axios";

export default function ChatBot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | selecting | seat | name | email

  const selectedTrain = useRef(null);
  const availableSeatsRef = useRef([]);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  // -----------------------------------------------------
  // FETCH SEATS
  // -----------------------------------------------------
  async function fetchSeatsForTrain(scheduleId, fromStopOrder, toStopOrder) {
    try {
      const res = await api.get("/api/seats/available", {
        params: { scheduleId, fromStopOrder, toStopOrder },
      });
      return res.data;
    } catch (err) {
      console.error("Seat fetch error:", err);
      return null;
    }
  }

  // -----------------------------------------------------
  // TRAIN SELECT
  // -----------------------------------------------------
  async function selectTrain(train) {
    const fromStopOrder =
      train.fromOrder ?? train.fromStopOrder ?? train.from ?? 1;
    const toStopOrder =
      train.toOrder ?? train.toStopOrder ?? train.to ?? fromStopOrder + 1;

    selectedTrain.current = {
      ...train,
      fromStopOrder,
      toStopOrder,
    };

    const seatData = await fetchSeatsForTrain(
      selectedTrain.current.scheduleId,
      fromStopOrder,
      toStopOrder
    );

    if (!seatData || seatData.length === 0) {
      availableSeatsRef.current = [];
    } else {
      availableSeatsRef.current = seatData.flatMap((car) =>
        car.seats.filter((s) => s.status === "available")
      );
    }

    setMode("seat");
    addMessage({
      sender: "ai",
      text: `You selected: ${train.train}.\nHow many seats do you need?`,
    });
  }

  // -----------------------------------------------------
  // SEND HANDLER
  // -----------------------------------------------------
  async function handleSend() {
    const userMsg = question.trim();
    if (!userMsg || loading) return;

    addMessage({ sender: "user", text: userMsg });
    setQuestion("");
    setLoading(true);

    try {
      // ---------- STEP 2: seat count ----------
      if (mode === "seat") {
        const count = parseInt(userMsg);
        if (isNaN(count) || count <= 0) {
          addMessage({ sender: "ai", text: "Enter a valid number of seats." });
          return;
        }

        selectedTrain.current.seatCount = count;
        setMode("name");
        addMessage({ sender: "ai", text: "Great — what's the passenger name?" });
        return;
      }

      // ---------- STEP 3: name ----------
      if (mode === "name") {
        selectedTrain.current.name = userMsg;
        setMode("email");
        addMessage({ sender: "ai", text: "Perfect — now enter email address." });
        return;
      }

      // ---------- STEP 4: email + booking ----------
      if (mode === "email") {
        selectedTrain.current.email = userMsg;

        addMessage({
          sender: "ai",
          text: "Booking your ticket... please wait ⏳",
        });

        try {
          const t = selectedTrain.current;

          const firstSeat = availableSeatsRef.current[0];

          const payload = {
            scheduleId: t.scheduleId,
            passengerName: t.name,
            seatIds: [firstSeat.seatId],
            fromStopOrder: t.fromStopOrder,
            toStopOrder: t.toStopOrder,
          };

          const createRes = await api.post("/api/booking/create", payload);
          const bookingId = createRes.data.id || createRes.data.Id;

          await api.post("/api/booking/passengers", {
            bookingId,
            passengers: [
              { fullName: t.name, email: t.email }
            ]
          });

          await api.post(`/api/booking/confirm/${bookingId}`);

          addMessage({
            sender: "ai",
            text: `🎟 Ticket Confirmed!\nBooking ID: ${bookingId}`,
          });

          setMode("idle");
        } catch (err) {
          console.error("Booking error:", err);
          addMessage({ sender: "ai", text: "❌ Booking failed." });
        }

        return;
      }

      // ---------- NORMAL MODE: ask AI ----------
      const reply = await sendChatMessage(userMsg);

      if (reply?.recommended) {
        setMode("selecting");

        const { personalized, fastest, cheapest, luxury } = reply.recommended;

        const others = [fastest, cheapest, luxury]
          .filter(Boolean)
          .filter(
            (t) =>
              !personalized ||
              t.scheduleId !== personalized.train?.scheduleId
          );

        addMessage({
          sender: "ai",
          text: reply.ai || "Here are the best options:",
        });

        addMessage({
          sender: "ai",
          type: "train-list",
          data: { personalized, others },
        });

        return;
      }

      addMessage({ sender: "ai", text: reply?.ai || "Try another query." });
    } catch (err) {
      addMessage({ sender: "ai", text: "⚠️ Communication error." });
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------------------
  // UI RENDER (panel version — no floating button)
  // -----------------------------------------------------
  return (
    <div className="w-full h-full flex flex-col border rounded-xl shadow bg-white">
      {/* Header */}
      <div className="p-3 border-b font-bold bg-blue-600 text-white">
        Railway Assistant
      </div>

      {/* Messages */}
      <div className="p-3 flex-1 overflow-y-auto space-y-2 bg-gray-50">
        {messages.map((m, i) => {
          if (m.type === "train-list") {
            const { personalized, others } = m.data;

            return (
              <div key={i} className="bg-gray-100 p-3 rounded-md space-y-4">
                {/* Personalized */}
                {personalized && (
                  <div className="p-3 border-2 border-red-500 rounded-lg bg-white shadow">
                    <div className="text-xs font-bold text-red-600 mb-1">
                      ❤️ Based on your past bookings
                    </div>

                    <button
                      onClick={() => selectTrain(personalized.train)}
                      className="w-full bg-blue-600 text-white p-2 rounded-md"
                    >
                      {personalized.train.train}
                    </button>
                  </div>
                )}

                {/* Others */}
                {others?.map((train) => (
                  <button
                    key={train.scheduleId}
                    onClick={() => selectTrain(train)}
                    className="w-full bg-blue-600 text-white p-2 rounded-md"
                  >
                    {train.train}
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
          <div className="text-xs text-gray-500">Thinking...</div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask something..."
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-1 rounded text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
