import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

export default function PaymentPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const bookingId = params.get("bookingId");
  const seatCount = Number(params.get("count"));
  const total = seatCount * 10;

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  function handleCardNumber(val) {
    let cleaned = val.replace(/\D/g, ""); 
    if (cleaned.length > 16) cleaned = cleaned.slice(0, 16);
    setCardNumber(cleaned);
  }

  function handleExpiry(val) {
    let cleaned = val.replace(/\D/g, ""); 
    if (cleaned.length > 4) cleaned = cleaned.slice(0, 4);

    if (cleaned.length >= 3) {
      cleaned = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    }

    setExpiry(cleaned);
  }

  function handleCvv(val) {
    let cleaned = val.replace(/\D/g, "");
    if (cleaned.length > 4) cleaned = cleaned.slice(0, 4);
    setCvv(cleaned);
  }

  async function pay() {
    if (!cardNumber || !expiry || !cvv) {
      alert("Enter all card details.");
      return;
    }

    setProcessing(true);

    try {
      await new Promise((res) => setTimeout(res, 1500));

      const intent = await api.post("/api/payment/create", {
        bookingId,
        amount: total
      });

      const paymentId = intent.data.id;
      if (!paymentId) throw new Error("Payment creation failed.");

      await api.post(`/api/payment/confirm/${paymentId}`);

      await api.post(`/api/booking/confirm/${bookingId}`);

      navigate(`/ticket?bookingId=${bookingId}`);
    } catch (err) {
      console.error(err);
      alert("Payment failed. Try again.");
    }

    setProcessing(false);
  }

  return (
    <div className="max-w-md mx-auto p-5 space-y-8">

      <button
        onClick={() => window.history.back()}
        className="text-blue-600 text-sm font-medium hover:underline"
      >
        ← Back
      </button>

      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Payment</h1>
        <p className="text-gray-500 mt-1">Secure payment for your booking.</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-5 border">

        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-lg">Total Amount</span>
          <span className="text-xl font-semibold text-gray-900">£{total}</span>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700 font-medium">Card Number</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => handleCardNumber(e.target.value)}
            placeholder="1234567812345678"
            className="w-full p-3 bg-gray-50 rounded-xl border focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-sm text-gray-700 font-medium">Expiry (MM/YY)</label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => handleExpiry(e.target.value)}
              placeholder="MM/YY"
              maxLength={5}
              className="w-full p-3 bg-gray-50 rounded-xl border focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="w-28 space-y-1">
            <label className="text-sm text-gray-700 font-medium">CVV</label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => handleCvv(e.target.value)}
              placeholder="123"
              maxLength={4}
              className="w-full p-3 bg-gray-50 rounded-xl border focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        <button
          onClick={pay}
          disabled={processing}
          className="w-full py-3 rounded-xl bg-black text-white font-semibold text-lg shadow hover:bg-gray-900 disabled:bg-gray-400 transition"
        >
          {processing ? "Processing…" : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
