using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.Models;
using Railway.Core.Services.Interfaces;
using static QRCoder.PayloadGenerator;

namespace Railway.Core.Services
{
    public class BookingService : IBookingService
    {
        private readonly RailwayDbContext _db;
        private readonly IEmailService _email;
        private readonly UserPreferenceService _preferenceService;


        public BookingService
            (
            RailwayDbContext db, 
            IEmailService email,
            UserPreferenceService preferenceService
            )
        {
            _db = db;
            _email = email;
            _preferenceService = preferenceService;
        }

        // STEP 1: Create pending booking (lock seats)
        public async Task<Booking> CreatePendingBookingAsync(
        string scheduleId,
        string UserId,
        string passengerName,
        List<string> seatIds,
        int fromStopOrder,
        int toStopOrder)
        {
            passengerName = string.IsNullOrWhiteSpace(passengerName)
        ? $"Guest-{Guid.NewGuid().ToString().Substring(0, 6)}"
        : passengerName;

            var booking = new Booking
            {
                UserId = UserId,                
                PassengerName = passengerName,  
                ScheduleId = scheduleId,
                Status = BookingStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = null
            };

            foreach (var seatId in seatIds)
            {
                booking.ReservedSeats.Add(new ReservedSeat
                {
                    SeatId = seatId,
                    FromStopOrder = fromStopOrder,
                    ToStopOrder = toStopOrder,
                    BookingId = booking.Id
                });
            }

            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();
            return await _db.Bookings
                .Include(b => b.ReservedSeats)
                .ThenInclude(rs => rs.Seat)
                .Include(b => b.Schedule)
                .FirstOrDefaultAsync(b => b.Id == booking.Id);
        }


        // STEP 2: Confirm booking
        public async Task<Booking> ConfirmBookingAsync(string bookingId)
        {
            var booking = await _db.Bookings
                .Include(b => b.ReservedSeats).ThenInclude(s => s.Seat)
                .Include(b => b.Passengers)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Stops)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Train)
                        .ThenInclude(t => t.TrainType)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Route)
                .FirstOrDefaultAsync(b => b.Id == bookingId);


            if (booking == null)
                throw new Exception("Booking not found.");

            // If already confirmed → return existing ticket and skip duplicate operations
            if (booking.Status == BookingStatus.Confirmed)
                return booking;

            booking.Status = BookingStatus.Confirmed;

            var fare = CalculateFare(booking);





            // ---------------- 1️⃣ Generate or Reuse Ticket ----------------
            var existingTicket = await _db.Tickets.FirstOrDefaultAsync(t => t.BookingId == booking.Id);

            Ticket ticket;

            if (existingTicket == null)
            {
                var qr = TicketGenerator.GenerateQr($"https://localhost:7019/api/booking/ticket/{booking.Id}");

                var fileName = $"QR_{booking.Id}.png";
                var folder = Path.Combine(AppContext.BaseDirectory, "qr-codes");
                Directory.CreateDirectory(folder);

                await File.WriteAllBytesAsync(Path.Combine(folder, fileName), qr.bytes);

                ticket = new Ticket
                {
                    BookingId = booking.Id,
                    TicketNumber = $"RAIL-{new Random().Next(100000, 999999)}",
                    IssuedAt = DateTime.UtcNow,
                    QrCodeBase64 = qr.base64,
                    QrFilePath = fileName
                };

                _db.Tickets.Add(ticket);
            }
            else
            {
                ticket = existingTicket;
            }

            await _db.SaveChangesAsync();

            // ✅ Update user preference here using the shared service
            var userKey = booking.UserId ?? booking.PassengerName;
            if (!string.IsNullOrWhiteSpace(userKey) &&
                booking.Schedule?.Train?.TrainType != null &&
                booking.Schedule?.Route != null)
            {
                await _preferenceService.AddOrUpdatePreference(
                    userKey,
                    booking.Schedule.Train.TrainType.Name,
                    booking.Schedule.Route.Name,
                    booking.Schedule.DepartureTime
                );
            }



            // ---------------- 2️⃣ Send Email to Primary Passenger ----------------
            try
            {
                var primaryPassenger = booking.Passengers?.FirstOrDefault();

                if (primaryPassenger != null && !string.IsNullOrWhiteSpace(primaryPassenger.Email))
                {
                    var seats = string.Join(", ", booking.ReservedSeats.Select(s => s.Seat.SeatNumber));

                    var emailBody = $@"
Hello {primaryPassenger.FullName},

🎉 Your railway ticket is confirmed!

----------------------
🚆 Route: {booking.Schedule.Route?.Name}
📍 From stop: {booking.ReservedSeats.First().FromStopOrder}
🏁 To stop: {booking.ReservedSeats.First().ToStopOrder}
📅 Departure: {booking.Schedule.DepartureTime:yyyy-MM-dd HH:mm}
💺 Seats: {seats}
🎟 Ticket Number: {ticket.TicketNumber}
----------------------

You can view or download your QR ticket here:
👉 https://localhost:7019/api/booking/ticket/{booking.Id}

Please show this ticket or the QR code while boarding.

Thanks for choosing Railway.";

                    await _email.SendEmailWithAttachmentAsync(
                        primaryPassenger.Email,
                        "Your Train Ticket is Confirmed 🎟",
                        emailBody.Replace("\n", "<br>"),
                        Convert.FromBase64String(ticket.QrCodeBase64),
                        $"{ticket.TicketNumber}.png"
                    );
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠ Email sending failed: {ex.Message}");
            }

            return booking;
        }
        // STEP 3: Cancel booking
        public async Task CancelBookingAsync(string bookingId)
        {
            var booking = await _db.Bookings.FindAsync(bookingId);

            if (booking == null)
                throw new Exception("Booking not found.");

            booking.Status = BookingStatus.Cancelled;

            await _db.SaveChangesAsync();
        }

        public async Task<Booking?> GetBookingByIdAsync(string bookingId)
        {
            return await _db.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Route)
                .Include(b => b.ReservedSeats)
                    .ThenInclude(rs => rs.Seat)
                .Include(b => b.Passengers)  // <-- REQUIRED
                .FirstOrDefaultAsync(b => b.Id == bookingId);
        }
        // STEP 4: Get all bookings for schedule
        public async Task<List<Booking>> GetBookingsForScheduleAsync(string scheduleId)
        {
            return await _db.Bookings
                .Where(b => b.ScheduleId == scheduleId)
                .Include(b => b.ReservedSeats)
                .ToListAsync();
        }
        public async Task<Ticket?> GetTicketByBookingIdAsync(string bookingId)
        {
            return await _db.Tickets
                .Include(t => t.Booking)
                    .ThenInclude(b => b.ReservedSeats)
                        .ThenInclude(s => s.Seat)
                .FirstOrDefaultAsync(t => t.BookingId == bookingId);
        }
        private decimal CalculateFare(Booking booking)
        {
            var schedule = _db.Schedules
                .Include(s => s.Route)
                    .ThenInclude(r => r.Stops)
                .Include(s => s.Train)
                    .ThenInclude(t => t.TrainType)
                .First(s => s.Id == booking.ScheduleId);

            var trainType = schedule.Train.TrainType;

            var from = booking.ReservedSeats.Min(rs => rs.FromStopOrder);
            var to = booking.ReservedSeats.Max(rs => rs.ToStopOrder);

            var stops = schedule.Route.Stops
                .Where(s => s.Order >= from && s.Order < to)
                .OrderBy(s => s.Order)
                .ToList();

            decimal totalKm = stops.Sum(s => s.DistanceFromPreviousKm);

            if (totalKm <= 0)
            {
                // Fallback: use stop count instead of distance
                var stopCount = Math.Max(1, to - from);
                const decimal flatPerStop = 10m;
                return stopCount * flatPerStop * booking.ReservedSeats.Count;
            }

            const decimal baseRatePerKm = 4.50m;
            var baseFare = totalKm * baseRatePerKm;
            var finalFare = baseFare * trainType.FareMultiplier;

            return Math.Round(finalFare, 2);
        }

        public async Task ResendTicketAsync(string bookingId)
        {
            var ticket = await _db.Tickets
                .Include(t => t.Booking)
                    .ThenInclude(b => b.Passengers)
                .FirstOrDefaultAsync(t => t.BookingId == bookingId);

            if (ticket == null)
                throw new Exception("Ticket not found.");

            var passenger = ticket.Booking.Passengers.FirstOrDefault();
            if (passenger == null)
                throw new Exception("Passenger info missing.");

            var seats = string.Join(", ", ticket.Booking.ReservedSeats.Select(s => s.Seat.SeatNumber));

            var body = $@"
Hello {passenger.FullName},

Here is a copy of your ticket.

Route: {ticket.Booking.Schedule.Route?.Name}
Departure: {ticket.Booking.Schedule.DepartureTime}
Seats: {seats}
Ticket No: {ticket.TicketNumber}

QR code attached.";

            await _email.SendEmailWithAttachmentAsync(
                passenger.Email,
                $"Your Ticket Copy - {ticket.TicketNumber}",
                body.Replace("\n", "<br>"),
                Convert.FromBase64String(ticket.QrCodeBase64),
                $"{ticket.TicketNumber}.png"
            );
        }



    }
}
