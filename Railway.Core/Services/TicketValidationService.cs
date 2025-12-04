using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.Models;
using Railway.Core.Services.Interfaces;

namespace Railway.Core.Services
{
    public class TicketValidationService : ITicketValidationService
    {
        private readonly RailwayDbContext _db;

        public TicketValidationService(RailwayDbContext db)
        {
            _db = db;
        }

        public async Task<TicketValidationResult> ValidateAsync(string qrData)
        {
            if (string.IsNullOrWhiteSpace(qrData))
                return new TicketValidationResult { Valid = false, Message = "QR data missing" };

            // QR format: bookingId|name|scheduleId
            var parts = qrData.Split('|');
            if (parts.Length < 1)
                return new TicketValidationResult { Valid = false, Message = "Invalid QR format" };

            var bookingId = parts[0];

            var ticket = await _db.Tickets
                .Include(t => t.Booking)
                    .ThenInclude(b => b.Schedule)
                        .ThenInclude(s => s.Route)
                .Include(t => t.Booking)
                    .ThenInclude(b => b.ReservedSeats)
                        .ThenInclude(rs => rs.Seat)
                .FirstOrDefaultAsync(t => t.BookingId == bookingId);

            if (ticket == null)
                return new TicketValidationResult { Valid = false, Message = "Ticket not found" };

            var booking = ticket.Booking;

            if (booking.Status != BookingStatus.Confirmed)
                return new TicketValidationResult { Valid = false, Message = "Ticket not confirmed" };

            if (ticket.IsUsed)
                return new TicketValidationResult { Valid = false, Message = "Ticket already used" };

            // Mark as used
            ticket.IsUsed = true;
            await _db.SaveChangesAsync();

            return new TicketValidationResult
            {
                Valid = true,
                Message = "Ticket Verified",
                Passenger = booking.PassengerName,
                Train = booking.Schedule.Train?.Name,
                Route = booking.Schedule.Route?.Name,
                Departure = booking.Schedule.DepartureTime,
                Seats = booking.ReservedSeats.Select(s => s.Seat.SeatNumber),
                TicketNumber = ticket.TicketNumber,
                Status = booking.Status.ToString()
            };
        }
    }
}
