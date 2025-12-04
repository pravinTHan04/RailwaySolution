import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

export default function PaymentPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const bookingId = params.get("bookingId");
  const seatCount = Number(params.get("count"));
  const pricePerSeat = 10;
  const total = seatCount * 10;

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  async function pay() {
    if (!cardNumber || !expiry || !cvv) {
      alert("Enter card details.");
      return;
    }

    setProcessing(true);

    // Fake delay for realism
    await new Promise(res => setTimeout(res, 2000));

    try {
      await api.post(`/api/booking/confirm/${bookingId}`);
      navigate(`/ticket?bookingId=${bookingId}`);
    } catch (err) {
      console.error(err);
      alert("Payment failed. Try again.");
    }

    setProcessing(false);
  }

  return (
    <div className="p-6 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Payment</h1>

      <p className="text-lg font-semibold">Total: £{total}</p>

      <input
        className="border p-2 w-full"
        placeholder="Card Number"
        value={cardNumber}
        onChange={e => setCardNumber(e.target.value)}
      />

      <div className="flex gap-2">
        <input
          className="border p-2 w-full"
          placeholder="MM/YY"
          value={expiry}
          onChange={e => setExpiry(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="CVV"
          value={cvv}
          onChange={e => setCvv(e.target.value)}
        />
      </div>

      <button
        onClick={pay}
        disabled={processing}
        className="bg-green-600 text-white w-full py-3 rounded text-lg"
      >
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}
