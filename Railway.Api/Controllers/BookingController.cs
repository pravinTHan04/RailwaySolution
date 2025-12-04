using Microsoft.AspNetCore.Mvc;
using Railway.Core.Services.Interfaces;

namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        // POST: api/booking/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            var booking = await _bookingService.CreatePendingBookingAsync(
                request.ScheduleId,
                request.PassengerName,
                request.SeatIds,
                request.FromStopOrder,
                request.ToStopOrder);

            return Ok(booking);
        }

        [HttpPost("confirm/{bookingId}")]
        public async Task<IActionResult> ConfirmBooking(string bookingId)
        {
            var result = await _bookingService.ConfirmBookingAsync(bookingId);
            return Ok(result);
        }

        [HttpPost("cancel/{bookingId}")]
        public async Task<IActionResult> CancelBooking(string bookingId)
        {
            await _bookingService.CancelBookingAsync(bookingId);
            return Ok("Cancelled");
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
}
