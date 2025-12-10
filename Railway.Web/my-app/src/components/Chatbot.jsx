import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api/aiChat";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ChatBot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | selecting | seat | name | email | confirm-payment

  const selectedTrain = useRef(null);
  const availableSeatsRef = useRef([]);

  const loggedInUserId = useRef(null);
  const loggedInUserEmail = useRef(null);
  const loggedInUserName = useRef(null);

  const suggestedSeatsRef = useRef([]);

  const navigate = useNavigate();

  const recognitionRef = useRef(null);


  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  // =============== FETCH SEATS ===============
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

  useEffect(() => {
  if (!("webkitSpeechRecognition" in window)) return;

  const rec = new window.webkitSpeechRecognition();
  rec.continuous = false;
  rec.interimResults = false;
  rec.lang = "en-US";

  rec.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setQuestion(transcript);          // fill input
    handleSend(transcript);           // auto-send voice text
  };

  recognitionRef.current = rec;
}, []);

function startListening() {
  if (!recognitionRef.current) return;
  recognitionRef.current.start();
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
  <div className="w-full h-full flex flex-col rounded-2xl bg-[#e0e0e0]
    shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] overflow-hidden">

    {/* HEADER */}
    <div className="p-4 text-center font-bold text-gray-700 bg-[#e0e0e0]
      shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
      Railway Assistant
    </div>

    {/* MESSAGES AREA */}
    <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      {messages.map((m, i) => {
        // --------------------------------------
        // TRAIN LIST MESSAGE (NEUMORPHIC CARD)
        // --------------------------------------
        if (m.type === "train-list") {
          const { personalized, others } = m.data;
          return (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#e0e0e0]
              shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]"
            >
              {/* Personalized */}
              {personalized && (
                <div className="p-3 rounded-xl mb-3 bg-[#e0e0e0]
                  shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]">
                  
                  <div className="text-xs font-bold text-red-600 mb-1">
                    ❤️ Based on your past bookings
                  </div>

                  <button
                    onClick={() => selectTrain(personalized.train)}
                    className="w-full text-left text-gray-700 p-3 rounded-xl bg-[#e0e0e0]
                    shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]
                    active:shadow-inner active:shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]"
                  >
                    <div className="font-bold">{personalized.train.train}</div>
                    <div className="text-xs">
                      Departure: {new Date(personalized.train.departure).toLocaleString()}
                    </div>
                    <div className="text-xs">Price: Rs. {personalized.train.price}</div>
                    <div className="text-xs">Travel Time: {personalized.train.travelTime} min</div>

                    <div className="text-xs text-yellow-600 font-semibold">
                      Expected Delay: {personalized.train.delay?.expectedDelayMinutes ?? 0} minutes
                    </div>

                    {personalized.train.delay?.confidence > 0.5 && (
                      <div className="text-xs text-orange-500 font-bold">
                        ⚠ High delay risk
                      </div>
                    )}
                  </button>
                </div>
              )}

              {/* Other recommended trains */}
              {others?.map((o) => (
                <button
                  key={o.train.scheduleId}
                  onClick={() => selectTrain(o.train)}
                  className="w-full text-left px-3 py-3 mb-3 rounded-xl bg-[#e0e0e0] text-gray-700
                  shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]
                  active:shadow-inner active:shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]"
                >
                  <div className="font-semibold">{o.train.train}</div>

                  <div className="text-xs">
                    Departure: {new Date(o.train.departure).toLocaleString()}
                  </div>
                  <div className="text-xs">Price: Rs. {o.train.price}</div>
                  <div className="text-xs">Travel Time: {o.train.travelTime} min</div>

                  <div className="text-xs text-yellow-600 font-semibold">
                    Expected Delay: {o.train.delay?.expectedDelayMinutes ?? 0} minutes
                  </div>

                  {o.train.delay?.confidence > 0.5 && (
                    <div className="text-[11px] text-orange-500 font-bold">
                      ⚠ High delay risk
                    </div>
                  )}
                </button>
              ))}
            </div>
          );
        }

        // --------------------------------------
        // PAYMENT BUTTON MESSAGE
        // --------------------------------------
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
              className="px-4 py-3 text-gray-700 rounded-xl bg-[#e0e0e0] 
              shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]
              active:shadow-inner active:shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]"
            >
              Proceed to Payment →
            </button>
          );
        }

        // --------------------------------------
        // STANDARD USER/AI MESSAGE
        // --------------------------------------
        return (
          <div
            key={i}
            className={`p-3 rounded-xl max-w-[80%] text-sm
              ${m.sender === "user" 
                ? "ml-auto bg-[#e0e0e0] shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]" 
                : "mr-auto bg-[#e0e0e0] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]"
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

    {/* INPUT BAR */}
    <div className="p-3 flex gap-3 
      shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] bg-[#e0e0e0]">

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Ask something..."
        className="flex-1 px-3 py-2 rounded-xl bg-[#e0e0e0] text-gray-700 
        shadow-inner shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]"
      />

      <button
        onClick={handleSend}
        className="px-5 py-2 rounded-xl bg-[#e0e0e0] text-gray-700 font-semibold
        shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]
        active:shadow-inner active:shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]"
      >
        Send
      </button>

      <button onClick={startListening}>🎤 Speak</button>

    </div>
  </div>
);

}
