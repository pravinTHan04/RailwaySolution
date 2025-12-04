using Microsoft.AspNetCore.Mvc;
using Railway.Core.Services.Interfaces;

namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeatsController : ControllerBase
    {
        private readonly ISeatAllocationService _seatService;

        public SeatsController(ISeatAllocationService seatService)
        {
            _seatService = seatService;
        }

        // GET: api/seats/available?scheduleId=123&fromStopOrder=1&toStopOrder=4
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableSeats(
            string scheduleId,
            int fromStopOrder,
            int toStopOrder)
        {
            var seats = await _seatService.GetAvailableSeatsAsync(scheduleId, fromStopOrder, toStopOrder);
            return Ok(seats); 
        }

        // POST: api/seats/lock
        [HttpPost("lock")]
        public async Task<IActionResult> LockSeats([FromBody] LockSeatRequest request)
        {
            var locked = await _seatService.LockSeatsAsync(
                request.ScheduleId,
                request.SeatIds,
                request.FromStopOrder,
                request.ToStopOrder,
                request.TempUserToken);

            return Ok(locked);
        }

        [HttpPost("unlock")]
        public async Task<IActionResult> UnlockSeats([FromBody] UnlockSeatRequest request)
        {
            var ok = await _seatService.UnlockSeatsAsync(request.ScheduleId, request.SeatIds);
            return Ok(new { success = ok });
        }

        public class UnlockSeatRequest
        {
            public string ScheduleId { get; set; }
            public List<string> SeatIds { get; set; }
        }

    }

    public class LockSeatRequest
    {
        public string ScheduleId { get; set; }
        public List<string> SeatIds { get; set; }
        public int FromStopOrder { get; set; }
        public int ToStopOrder { get; set; }
        public string TempUserToken { get; set; }
    }
}
