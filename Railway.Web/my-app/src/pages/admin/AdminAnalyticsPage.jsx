import { useState } from "react";
import api from "../../api/axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function AdminAnalyticsPage() {

  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loadFactor, setLoadFactor] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [aiPredictions, setAiPredictions] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiInsights, setAiInsights] = useState("");

  const [error, setError] = useState("");

  /* ---------------- FETCH FUNCTIONS ---------------- */

  async function fetchLoadFactor() {
    try {
      const res = await api.get("/api/admin/load-factor", { params: { date } });
      setLoadFactor(res.data);
    } catch {
      setError("Failed to load load factor.");
    }
  }

  async function fetchRevenue() {
    try {
      const res = await api.get("/api/admin/revenue", { params: { from, to } });
      setRevenue(res.data);
    } catch {
      setError("Failed to load revenue.");
    }
  }

  async function fetchBookings() {
    try {
      const res = await api.get("/api/admin/bookings-over-time", {
        params: { from, to },
      });
      setBookings(res.data);
    } catch {
      setError("Failed to load booking stats.");
    }
  }

  async function fetchAiPredictions() {
    try {
      setLoadingAi(true);
      const dataset = { loadFactor, revenue, bookings };

      const res = await api.post("/api/admin/ai-predict", dataset);
      let predictions = res.data.predictions;

      if (typeof predictions === "string") {
        predictions = JSON.parse(predictions);
      }

      setAiPredictions(predictions);
    } catch {
      setError("AI could not generate predictions.");
    } finally {
      setLoadingAi(false);
    }
  }

  async function fetchAiInsights() {
    try {
      const analyticsData = { loadFactor, revenue, bookings };
      const res = await api.post("/api/admin/analytics-insights", analyticsData);
      setAiInsights(res.data.insights);
    } catch {
      setAiInsights("AI could not generate insights.");
    }
  }

  function loadAll() {
    setError("");
    if (date) fetchLoadFactor();
    if (from && to) {
      fetchRevenue();
      fetchBookings();
    }
  }

  /* ---------------- Reusable UI ---------------- */

  const Card = ({ title, children }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );

  const SoftInput = (props) => (
    <input
      {...props}
      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-black/10"
    />
  );

  const SimpleTable = ({ columns, rows }) => (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left bg-white">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="p-3 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {Object.values(r).map((c, j) => (
                <td key={j} className="p-3">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const ChartBlock = ({ label, data, dataKey }) => (
    <Card title={label}>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#e5e7eb" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  /* ---------------- Main UI ---------------- */

  return (
    <div className="min-h-screen p-6 space-y-10 bg-gray-50">
      
      {/* Title */}
      <h1 className="text-3xl font-semibold">Admin Analytics Dashboard</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl">{error}</div>}

      {/* Filters */}
      <Card title="Filters">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Load Factor Date</label>
            <SoftInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">From</label>
            <SoftInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">To</label>
            <SoftInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={loadAll}
            className="px-6 py-3 bg-black text-white rounded-xl font-semibold"
          >
            Load Analytics
          </button>

          <button
            onClick={fetchAiPredictions}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold"
          >
            🔮 AI Predictions
          </button>

          <button
            onClick={fetchAiInsights}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold"
          >
            🧠 AI Insights
          </button>
        </div>
      </Card>

      {/* LOAD FACTOR */}
      {date && (
        <Card title={`Load Factor – ${date}`}>
          {loadFactor.length === 0 ? (
            <p className="text-gray-600">No data.</p>
          ) : (
            <>
              <SimpleTable
                columns={["Train", "Capacity", "Booked", "% Load"]}
                rows={loadFactor.map((lf) => ({
                  train: lf.train,
                  totalSeats: lf.totalSeats,
                  bookedSeats: lf.bookedSeats,
                  loadFactor: `${lf.loadFactor.toFixed(1)}%`,
                }))}
              />
              <ChartBlock
                label="Load Factor Chart"
                data={loadFactor.map((x) => ({ ...x, date: x.train }))}
                dataKey="loadFactor"
              />
            </>
          )}
        </Card>
      )}

      {/* REVENUE */}
      {from && to && (
        <Card title={`Revenue (${from} → ${to})`}>
          {revenue.length === 0 ? (
            <p>No revenue data.</p>
          ) : (
            <>
              <SimpleTable
                columns={["Date", "Total Revenue (£)", "Payments"]}
                rows={revenue.map((r) => ({
                  date: new Date(r.date).toLocaleDateString(),
                  totalRevenue: `£${r.totalRevenue}`,
                  payments: r.payments,
                }))}
              />

              <ChartBlock
                label="Revenue Chart"
                data={revenue}
                dataKey="totalRevenue"
              />
            </>
          )}
        </Card>
      )}

      {/* BOOKINGS */}
      {from && to && (
        <Card title="Bookings Over Time">
          {bookings.length === 0 ? (
            <p>No booking data.</p>
          ) : (
            <>
              <SimpleTable
                columns={["Date", "Bookings"]}
                rows={bookings.map((b) => ({
                  date: new Date(b.date).toLocaleDateString(),
                  bookings: b.bookings,
                }))}
              />

              <ChartBlock
                label="Bookings Chart"
                data={bookings}
                dataKey="bookings"
              />
            </>
          )}
        </Card>
      )}

      {/* AI PREDICTIONS */}
      {aiPredictions && (
        <Card title="AI Predictions (Next 7 Days)">
          
          {/* Revenue */}
          <div>
            <h3 className="font-semibold">Revenue Forecast</h3>
            <ul className="list-disc ml-6 mt-2">
              {aiPredictions.forecastRevenue.map((r, i) => (
                <li key={i}>{r.date}: £{r.value}</li>
              ))}
            </ul>
          </div>

          {/* Insights */}
          {aiInsights && (
            <div className="bg-gray-100 p-4 rounded-xl border">
              <h3 className="font-semibold mb-2">AI Insights</h3>
              <p className="text-gray-700">{aiInsights}</p>
            </div>
          )}

          {/* Load Factor */}
          <div>
            <h3 className="font-semibold mt-4">Load Factor Forecast</h3>
            <ul className="list-disc ml-6 mt-2">
              {aiPredictions.forecastLoadFactor.map((lf, i) => (
                <li key={i}>{lf.date}: {lf.value}%</li>
              ))}
            </ul>
          </div>

          {/* Demand */}
          <div>
            <h3 className="font-semibold mt-4">Expected Seat Demand</h3>
            <ul className="list-disc ml-6 mt-2">
              {aiPredictions.expectedSeatDemand.map((d, i) => (
                <li key={i}>{d.route}: <strong>{d.demandLevel}</strong></li>
              ))}
            </ul>
          </div>

          {/* Delay */}
          <div>
            <h3 className="font-semibold mt-4">Delay Risk</h3>
            <ul className="list-disc ml-6 mt-2">
              {aiPredictions.delayRisk.map((d, i) => (
                <li key={i}>
                  {d.train}: {(d.delayProbability * 100).toFixed(0)}% chance — {d.expectedDelayMinutes} min delay
                </li>
              ))}
            </ul>
          </div>

        </Card>
      )}

    </div>
  );
}
