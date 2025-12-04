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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🎫 Your Ticket</h1>

      <div className="border p-4 rounded bg-white shadow">
        <p><b>Passenger:</b> {ticket.passenger}</p>
        <p><b>Status:</b> {ticket.status}</p>
<p><b>Seats:</b> {ticket.seats?.join(", ") || "N/A"}</p>
        <p><b>Issued:</b> {new Date(ticket.issuedAt).toLocaleString()}</p>
      </div>

      <img
        src={`data:image/png;base64,${ticket.qrBase64}`}
        alt="QR Code"
        className="w-48 h-48 mx-auto border rounded"
      />

      <a
        href={ticket.qrDownloadUrl}
        className="bg-blue-600 text-white px-6 py-2 rounded block text-center"
        download
      >
        Download QR Code
      </a>

      <button
      className="bg-green-600 text-white px-6 py-2 rounded block text-center"
      onClick={async () => {
        try {
          await api.post(`/api/booking/resend-ticket/${bookingId}`);
          alert("📩 Ticket sent again to your email.");
        } catch (err) {
          console.error(err);
          alert("Failed to resend email.");
        }
      }}
    >
      ✉ Resend Ticket to Email
    </button>
    </div>
  );
}
