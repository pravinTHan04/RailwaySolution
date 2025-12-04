using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Railway.Core.DTOs;
using Railway.Core.Services.Trains;

namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/trains/{trainId}/carriages")]
    public class TrainCarriagesController : ControllerBase
    {
        private readonly ITrainService _service;

        public TrainCarriagesController(ITrainService service)
        {
            _service = service;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> AddCarriage(string trainId, [FromBody] CreateCarriageRequest request)
        {
            if (request.SeatCount <= 0)
                return BadRequest("SeatCount must be greater than zero.");

            var carriage = await _service.AddCarriageAsync(trainId, request.SeatCount);

            if (carriage == null)
                return NotFound("Train not found.");

            return Ok(new
            {
                carriageId = carriage.Id,
                carriage.Index,
                seatsGenerated = request.SeatCount
            });
        }
    }
}
