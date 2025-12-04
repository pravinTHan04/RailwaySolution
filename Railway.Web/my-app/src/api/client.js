const API_BASE = "https://localhost:7019/api";

export async function fetchSchedule() {
  const res = await fetch(`${API_BASE}/schedules`);
  return res.json();
}

export async function generateSchedule(requestBody) {
  const res = await fetch(`${API_BASE}/schedules/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  return res.json();
}

export async function createBooking(booking) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  return res.json();
}

export async function fetchBookings() {
  const res = await fetch(`${API_BASE}/bookings`);
  return res.json();
}

export async function askAI(question) {
  const res = await fetch(`${API_BASE}/ai/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  return res.json();
}
