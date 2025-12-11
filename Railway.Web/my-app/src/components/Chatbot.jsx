import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api/aiChat";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import usePcmRecorder from "../hooks/usePcmRecorder";

export default function ChatBot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | selecting | seat | name | email | confirm-payment


const { startRecording, stopRecording, recording } = usePcmRecorder();

  const selectedTrain = useRef(null);
  const availableSeatsRef = useRef([]);

  const loggedInUserId = useRef(null);
  const loggedInUserEmail = useRef(null);
  const loggedInUserName = useRef(null);

  const suggestedSeatsRef = useRef([]);

  const navigate = useNavigate();



  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

async function handleVoice() {
  if (!recording) {
    startRecording();
    addMessage({ sender: "ai", text: "🎤 Listening..." });
  } else {
    const wavBlob = await stopRecording();

    const formData = new FormData();
    formData.append("audio", wavBlob, "speech.wav");

    const res = await api.post("/api/ai/speech-to-text", formData);

    const text = res.data.text;

    addMessage({ sender: "user", text });
    handleSend(text); // send to chat logic
  }
}


async function sendAudioToServer(wavBlob) {
  const formData = new FormData();
  formData.append("audio", wavBlob, "speech.wav");

  const res = await api.post("/api/ai/speech-to-text", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  const text = res.data.text;
  setQuestion(text); // autofill the text box
  handleSend(text);  // optionally auto-send
}

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







  // =============== TRAIN SELECT ===============
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

    selectedTrain.current.userId = loggedInUserId.current;
    selectedTrain.current.userEmail = loggedInUserEmail.current;
    selectedTrain.current.userName = loggedInUserName.current;

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

  // SEND HANDLER

async function handleSend(injectedText = null) {
  const userMsg = injectedText ? injectedText : question.trim();
    if (!userMsg || loading) return;

    const ticketMatch = userMsg.match(/RAIL-\d{6}/i);
if (ticketMatch) {
  const ticketRef = ticketMatch[0].toUpperCase();

  if (userMsg.toLowerCase().includes("cancel")) {
    return handleCancelByTicket(ticketRef);
  }

  if (userMsg.toLowerCase().includes("resend") ||
      userMsg.toLowerCase().includes("send ticket")) {
    return handleResendByTicket(ticketRef);
  }
}
    if (mode === "confirm-payment") return; // lock input after we show payment button

    addMessage({ sender: "user", text: userMsg });
    setQuestion("");
    setLoading(true);

    try {
      // ---------- STEP 2: seat count ----------
      if (mode === "seat") {
        const count = parseInt(userMsg);
        if (isNaN(count) || count <= 0) {
          addMessage({ sender: "ai", text: "Enter a valid number of seats." });
          setLoading(false);
          return;
        }

        selectedTrain.current.seatCount = count;

        // 🔥 Use your existing suggest-seats endpoint
        try {
          const res = await api.post("/api/booking/suggest-seats", {
            scheduleId: selectedTrain.current.scheduleId,
            fromStopOrder: selectedTrain.current.fromStopOrder,
            toStopOrder: selectedTrain.current.toStopOrder,
            seatCount: count,
          });

          console.log("💺 AI seat suggestion:", res.data);

          if (!res.data || !res.data.seats || res.data.seats.length === 0) {
            addMessage({
              sender: "ai",
              text:
                "I couldn't find a good seat group. We'll continue without a suggestion.",
            });
            suggestedSeatsRef.current = [];
            selectedTrain.current.seatIds = [];
          } else {
            suggestedSeatsRef.current = res.data.seats;
            selectedTrain.current.seatIds = res.data.seats.map((s) => s.seatId);

            const seatList = res.data.seats
              .map((s) => s.seatNumber)
              .join(", ");

            addMessage({
              sender: "ai",
              text: `I suggest these seats: ${seatList}.`,
            });
          }
        } catch (err) {
          console.error("Seat suggestion via AI failed:", err);
          addMessage({
            sender: "ai",
            text:
              "I couldn't fetch seat suggestions, but we can still continue the booking.",
          });
          suggestedSeatsRef.current = [];
          selectedTrain.current.seatIds = [];
        }

        setMode("name");
        addMessage({
          sender: "ai",
          text: "Great — what's the passenger name?",
        });
        setLoading(false);
        return;
      }

      // ---------- STEP 3: name ----------
      if (mode === "name") {
        selectedTrain.current.name = userMsg;
        setMode("email");
        addMessage({
          sender: "ai",
          text: "Perfect — now enter email address.",
        });
        setLoading(false);
        return;
      }

      // ---------- STEP 4: email -> PREPARE BOOKING PAYLOAD ----------
      if (mode === "email") {
        selectedTrain.current.email = userMsg;

        const t = selectedTrain.current;

        // Make sure we have seatIds; if not, fallback to first N available
        let seatIds = t.seatIds;
        if (!seatIds || seatIds.length === 0) {
          const available = availableSeatsRef.current || [];
          if (available.length < t.seatCount) {
            addMessage({
              sender: "ai",
              text: `❌ Only ${available.length} seats available. You requested ${t.seatCount}.`,
            });
            setLoading(false);
            return;
          }
          seatIds = available.slice(0, t.seatCount).map((s) => s.seatId);
          t.seatIds = seatIds;
        }

        const bookingPayload = {
          scheduleId: t.scheduleId,
          fromStopOrder: t.fromStopOrder,
          toStopOrder: t.toStopOrder,
          seatIds: seatIds,
          seatCount: t.seatCount,
          passengerName: t.name,
          email: t.email,
        };

        setMode("confirm-payment");

        addMessage({
          sender: "ai",
          text: `Perfect! Shall I proceed to payment for ${t.seatCount} seat(s)?`,
        });

        addMessage({
          sender: "ai",
          type: "payment-button",
          data: bookingPayload,
        });

        setLoading(false);
        return;
      }

      // ---------- NORMAL MODE: ask AI ----------
      const reply = await sendChatMessage(userMsg);
      console.log("🔥 RAW AI REPLY:", reply);

      // Store identity from AI response
      if (reply.user?.id) loggedInUserId.current = reply.user.id;
      if (reply.user?.email) loggedInUserEmail.current = reply.user.email;
      if (reply.user?.name) loggedInUserName.current = reply.user.name;

      // New AI shape: { intent, result, user }
      const result = reply.result || reply; // fallback in case

      if (result?.recommended) {
        setMode("selecting");

        const { personalized, fastest, cheapest, luxury } = result.recommended;

        const others = [fastest, cheapest, luxury]
          .filter(Boolean)
          .filter(
            (t) =>
              !personalized || t.scheduleId !== personalized.train?.scheduleId
          );

        addMessage({
          sender: "ai",
          text: result.ai || "Here are the best options:",
        });

        addMessage({
          sender: "ai",
          type: "train-list",
          data: { personalized, others },
        });

        setLoading(false);
        return;
      }

      addMessage({ sender: "ai", text: result?.ai || "Try another query." });
    } catch (err) {
      console.error("AI error:", err);
      addMessage({ sender: "ai", text: "⚠️ Communication error." });
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelByTicket(ticketRef) {
  addMessage({ sender: "user", text: `Cancel booking ${ticketRef}` });

  try {
    // 1) Convert ticketRef → bookingId
    const lookup = await api.get(`/api/booking/get-by-ticket/${ticketRef}`);
    const bookingId = lookup.data.id;

    if (!bookingId) {
      addMessage({ sender: "ai", text: "I couldn't find that ticket." });
      return;
    }

    // 2) Cancel booking
    await api.post(`/api/booking/cancel/${bookingId}`);

    addMessage({
      sender: "ai",
      text: `Booking with ticket ${ticketRef} has been cancelled successfully.`,
    });

  } catch (err) {
    console.error(err);
    addMessage({
      sender: "ai",
      text: `Failed to cancel booking for ${ticketRef}.`,
    });
  }
}

async function handleResendByTicket(ticketRef) {
  addMessage({ sender: "user", text: `Resend ticket ${ticketRef}` });

  try {
    // 1) Convert ticketRef → bookingId
    const lookup = await api.get(`/api/booking/get-by-ticket/${ticketRef}`);
    const bookingId = lookup.data.id;

    if (!bookingId) {
      addMessage({ sender: "ai", text: "I couldn't find that ticket." });
      return;
    }

    // 2) Resend ticket email
    await api.post(`/api/booking/resend-ticket/${bookingId}`);

    addMessage({
      sender: "ai",
      text: `I have emailed your ticket (${ticketRef}) again.`,
    });

  } catch (err) {
    console.error(err);
    addMessage({
      sender: "ai",
      text: `Failed to resend ticket for ${ticketRef}.`,
    });
  }
}


  // --- QUICK COMMAND PARSER (Cancel / Resend) ---



  // ==================================================
  // RENDER
  // ==================================================
return (
  <div className="w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    
    {/* Header */}
    <div className="p-4 border-b border-gray-200 bg-white text-center font-semibold text-gray-900">
      Railway Assistant
    </div>

    {/* Messages */}
    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">

      {messages.map((m, i) => {

        // TRAIN LIST (Apple Card Style)
        if (m.type === "train-list") {
          const { personalized, others } = m.data;

          return (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">

              {personalized && (
                <div className="border border-gray-300 rounded-lg p-3 bg-white">
                  <div className="text-xs font-medium text-red-600 mb-1">
                    ❤️ Based on your past bookings
                  </div>

                  <button
                    onClick={() => selectTrain(personalized.train)}
                    className="w-full text-left space-y-1"
                  >
                    <div className="font-semibold text-gray-900">{personalized.train.train}</div>
                    <div className="text-xs text-gray-600">
                      Departure: {new Date(personalized.train.departure).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Price: Rs. {personalized.train.price}</div>
                    <div className="text-xs text-gray-600">Travel Time: {personalized.train.travelTime} min</div>

                    <div className="text-xs text-yellow-600 font-medium">
                      Expected Delay: {personalized.train.delay?.expectedDelayMinutes ?? 0} minutes
                    </div>

                    {personalized.train.delay?.confidence > 0.5 && (
                      <div className="text-xs text-orange-500 font-bold">⚠ High delay risk</div>
                    )}
                  </button>
                </div>
              )}

              {/* Other recommended */}
              {others?.map((o) => (
                <button
                  key={o.train.scheduleId}
                  onClick={() => selectTrain(o.train)}
                  className="w-full border border-gray-300 bg-white rounded-lg p-3 text-left space-y-1"
                >
                  <div className="font-semibold text-gray-900">{o.train.train}</div>
                  <div className="text-xs text-gray-600">
                    Departure: {new Date(o.train.departure).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Price: Rs. {o.train.price}</div>
                  <div className="text-xs text-gray-600">Travel Time: {o.train.travelTime} min</div>

                  <div className="text-xs text-yellow-600 font-medium">
                    Expected Delay: {o.train.delay?.expectedDelayMinutes ?? 0} minutes
                  </div>

                  {o.train.delay?.confidence > 0.5 && (
                    <div className="text-xs text-orange-500 font-bold">⚠ High delay risk</div>
                  )}
                </button>
              ))}
            </div>
          );
        }

        // PAYMENT BUTTON
        if (m.type === "payment-button") {
          return (
            <button
              key={i}
              onClick={async () => {
                try {
                  const t = m.data;

                  const createRes = await api.post("/api/booking/create", {
                    scheduleId: t.scheduleId,
                    seatIds: t.seatIds,
                    fromStopOrder: t.fromStopOrder,
                    toStopOrder: t.toStopOrder,
                  });

                  const bookingId = createRes.data.id;
                  if (!bookingId) {
                    alert("❌ Booking failed. No booking ID returned.");
                    return;
                  }

                  const passengersPayload = {
                    BookingId: bookingId,
                    Passengers: Array.from(
                      { length: t.seatCount || 1 },
                      () => ({
                        FullName: t.passengerName,
                        Email: t.email,
                      })
                    ),
                  };

                  await api.post("/api/booking/passengers", passengersPayload);

                  navigate(`/payment?bookingId=${bookingId}&count=${t.seatCount || 1}`);
                } catch (err) {
                  console.error("AI Booking failed:", err);
                  alert("Failed to prepare booking");
                }
              }}
              className="w-full bg-black text-white p-3 rounded-lg text-center font-medium hover:bg-gray-900 transition"
            >
              Proceed to Payment →
            </button>
          );
        }

        // REGULAR MESSAGES
        return (
          <div
            key={i}
            className={`max-w-[80%] p-3 text-sm rounded-xl ${
              m.sender === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "mr-auto bg-white border border-gray-200 text-gray-900"
            }`}
          >
            {m.text}
          </div>
        );
      })}

      {loading && <div className="text-xs text-gray-500">Thinking...</div>}
    </div>

    {/* Input Bar */}
    <div className="p-3 border-t border-gray-200 bg-white flex gap-2">

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Ask something..."
        className="flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black/20 text-sm"
      />

      <button
        onClick={handleSend}
        className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-900 transition"
      >
        Send
      </button>

      <button
        onClick={handleVoice}
        className="px-3 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300 transition"
      >
        {recording ? "⛔ Stop" : "🎤"}
      </button>

    </div>

  </div>
);

}
