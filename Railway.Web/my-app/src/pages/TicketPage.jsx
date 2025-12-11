import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";

export default function TicketPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    async function loadTicket() {
      try {
        const res = await api.get(`/api/booking/ticket/${bookingId}`);
        setTicket(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadTicket();
  }, [bookingId]);

  if (!ticket) return <p className="p-6">Loading ticket...</p>;

return (
  <div className="max-w-md mx-auto p-6 space-y-8">

    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900">Your Ticket</h1>
      <p className="text-gray-500 text-sm mt-1">Booking Confirmation</p>
    </div>

    <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">

      <div className="space-y-2">
        <p className="text-sm text-gray-500">Passenger</p>
        <p className="text-lg font-semibold text-gray-800">{ticket.passenger}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-500">Status</p>
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            ticket.status === "Confirmed"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {ticket.status}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-500">Seats</p>
        <p className="font-medium text-gray-800">
          {ticket.seats?.join(", ") || "N/A"}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-500">Issued</p>
        <p className="font-medium text-gray-800">
          {new Date(ticket.issuedAt).toLocaleString()}
        </p>
      </div>
    </div>

    <div className="flex flex-col items-center gap-4">
      <img
        src={`data:image/png;base64,${ticket.qrBase64}`}
        alt="QR Code"
        className="w-52 h-52 rounded-xl border shadow-md"
      />

      <a
        href={ticket.qrDownloadUrl}
        download
        className="w-full text-center py-3 rounded-xl bg-black text-white font-semibold shadow hover:bg-gray-900 transition"
      >
        Download QR Code
      </a>
    </div>

    <button
      onClick={async () => {
        try {
          await api.post(`/api/booking/resend-ticket/${bookingId}`);
          alert("📩 Ticket sent again to your email.");
        } catch (err) {
          console.error(err);
          alert("Failed to resend email.");
        }
      }}
      className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
    >
      Resend Ticket to Email
    </button>

    <button
      onClick={() => navigate("/profile")}
      className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium shadow hover:bg-gray-200 transition"
    >
      ← Back to Profile
    </button>
  </div>
);

}
