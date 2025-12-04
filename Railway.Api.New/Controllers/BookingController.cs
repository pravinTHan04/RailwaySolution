using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.Models;
using Railway.Core.Services.Interfaces;
using static QRCoder.PayloadGenerator;

namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/booking")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly RailwayDbContext _db;
        private readonly IEmailService _email;


        public BookingController(IBookingService bookingService, RailwayDbContext db, IEmailService email)
        {
            _bookingService = bookingService;
            _db = db;
            _email = email;
        }

        // ---------------- CREATE BOOKING (TEMP) ----------------
        [HttpPost("create")]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            string userIdentity;

            if (User.Identity?.IsAuthenticated == true)
            {
                userIdentity = User.Identity.Name!;
            }
            else
            {
                userIdentity = request.PassengerName ?? $"guest_{Guid.NewGuid()}";
            }

            var booking = await _bookingService.CreatePendingBookingAsync(
                request.ScheduleId,
                userIdentity,
                request.SeatIds,
                request.FromStopOrder,
                request.ToStopOrder
            );

            return Ok(booking);
        }



        // ---------------- CONFIRM BOOKING ----------------
        [AllowAnonymous]
        [HttpPost("confirm/{bookingId}")]
        public async Task<IActionResult> ConfirmBooking(string bookingId)
        {
            var result = await _bookingService.ConfirmBookingAsync(bookingId);
            return Ok(result);
        }

        // ---------------- GET BOOKING ----------------
        [AllowAnonymous]
        [HttpGet("{bookingId}")]
        public async Task<IActionResult> GetBooking(string bookingId)
        {
            var booking = await _bookingService.GetBookingByIdAsync(bookingId);

            if (booking == null)
                return NotFound(new { message = "Booking not found" });

            return Ok(new
            {
                booking.Id,
                booking.PassengerName,
                status = booking.Status.ToString(),
                seats = booking.ReservedSeats.Select(s => s.Seat.SeatNumber),
            });
        }

        // ---------------- CANCEL BOOKING ----------------
        [AllowAnonymous]
        [HttpPost("cancel/{bookingId}")]
        public async Task<IActionResult> CancelBooking(string bookingId)
        {
            await _bookingService.CancelBookingAsync(bookingId);
            return Ok("Cancelled");
        }

        // ---------------- TICKET ----------------
        [AllowAnonymous]
        [HttpGet("ticket/{bookingId}")]
        public async Task<IActionResult> GetTicket(string bookingId)
        {
            var ticket = await _bookingService.GetTicketByBookingIdAsync(bookingId);

            if (ticket == null)
                return NotFound("Ticket not found.");

            return Ok(new
            {
                ticket.TicketNumber,
                ticket.IssuedAt,
                passenger = ticket.Booking.PassengerName,
                seats = ticket.Booking.ReservedSeats.Select(s => s.Seat.SeatNumber).ToList(),
                status = ticket.Booking.Status.ToString(),
                qrBase64 = ticket.QrCodeBase64,
                qrDownloadUrl = $"{Request.Scheme}://{Request.Host}/api/booking/ticket/{bookingId}/qr"
            });
        }

        // ---------------- QR DOWNLOAD ----------------
        [AllowAnonymous]
        [HttpGet("ticket/{bookingId}/qr")]
        public async Task<IActionResult> DownloadQr(string bookingId)
        {
            var ticket = await _bookingService.GetTicketByBookingIdAsync(bookingId);

            if (ticket == null || string.IsNullOrWhiteSpace(ticket.QrFilePath))
                return NotFound(new { message = "QR not available." });

            var folder = Path.Combine(AppContext.BaseDirectory, "qr-codes");
            var path = Path.Combine(folder, ticket.QrFilePath);

            if (!System.IO.File.Exists(path))
                return NotFound();

            var file = await System.IO.File.ReadAllBytesAsync(path);
            return File(file, "image/png", ticket.QrFilePath);
        }

        [HttpPost("passengers")]
        public async Task<IActionResult> SavePassengerDetails([FromBody] PassengerInfoRequest req)
        {
            var booking = await _db.Bookings
                .Include(b => b.Passengers)
                .FirstOrDefaultAsync(b => b.Id == req.BookingId);

            if (booking == null)
                return BadRequest(new { error = "Booking not found." });

            if (req.Passengers == null || !req.Passengers.Any())
                return BadRequest(new { error = "Passenger list cannot be empty." });

            if (req.Passengers.Any(p => string.IsNullOrWhiteSpace(p.FullName) || string.IsNullOrWhiteSpace(p.Email)))
                return BadRequest(new { error = "Full name and email are required." });

            // Remove previous entries
            if (booking.Passengers.Any())
                _db.Passengers.RemoveRange(booking.Passengers);

            booking.Passengers = req.Passengers.Select(p => new Passenger
            {
                FullName = p.FullName.Trim(),
                Email = p.Email.Trim().ToLower()
            }).ToList();

            // 🔥 SET BOOKING NAME TO PRIMARY PASSENGER
            booking.PassengerName = booking.Passengers.First().FullName;

            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Passenger details updated." });
        }


        [HttpPost("resend-ticket/{bookingId}")]
        public async Task<IActionResult> ResendTicket(string bookingId)
        {
            var booking = await _bookingService.GetBookingByIdAsync(bookingId);

            if (booking == null)
                return NotFound(new { error = "Booking not found." });

            if (booking.Passengers == null || !booking.Passengers.Any())
                return BadRequest(new { error = "Passenger info missing." });

            // Get ticket
            var ticket = await _bookingService.GetTicketByBookingIdAsync(bookingId);
            if (ticket == null)
                return BadRequest(new { error = "Ticket not generated yet." });

            var primary = booking.Passengers.First();
            var seats = string.Join(", ", booking.ReservedSeats.Select(s => s.Seat.SeatNumber));

            var body = $@"
Hello {primary.FullName},

Here is a copy of your ticket.

🚆 Route: {booking.Schedule.Route?.Name}
📅 Departure: {booking.Schedule.DepartureTime}
💺 Seats: {seats}
🎟 Ticket No: {ticket.TicketNumber}

QR code is attached.";

            try
            {
                await _email.SendEmailWithAttachmentAsync(
                    primary.Email,
                    $"Your Ticket Copy - {ticket.TicketNumber}",
                    body.Replace("\n", "<br>"),
                    Convert.FromBase64String(ticket.QrCodeBase64),
                    $"{ticket.TicketNumber}.png"
                );
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = $"Email failed: {ex.Message}" });
            }

            return Ok(new { success = true, message = "Ticket sent again successfully." });
        }


    }

    public class CreateBookingRequest
    {
        public string ScheduleId { get; set; }
        public string PassengerName { get; set; }
        public List<string> SeatIds { get; set; }
        public int FromStopOrder { get; set; }
        public int ToStopOrder { get; set; }
    }

    public class PassengerInfoRequest
    {
        public string BookingId { get; set; }
        public List<PassengerRequest> Passengers { get; set; }
    }

    public class PassengerRequest
    {
        public string FullName { get; set; }
        public string Email { get; set; }
    }
}
