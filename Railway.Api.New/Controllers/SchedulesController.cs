using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Railway.Core.DTOs;
using Railway.Core.Services.Interfaces;

[Route("api/[controller]")]
[ApiController]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _service;

    public SchedulesController(IScheduleService service)
    {
        _service = service;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> Get() =>
        Ok(await _service.GetSchedulesAsync());

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateScheduleRequest request)
    {
        var schedule = await _service.GenerateScheduleAsync(request.RouteId, request.TrainId, request.DepartureTime);
        return Ok(schedule);
    }

    // ⭐ FIXED MANUAL SEARCH ENDPOINT
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string from,
        [FromQuery] string to,
        [FromQuery] string date)
    {
        if (string.IsNullOrWhiteSpace(from) ||
            string.IsNullOrWhiteSpace(to) ||
            string.IsNullOrWhiteSpace(date))
        {
            return BadRequest("Missing parameters.");
        }

        if (!DateTime.TryParse(date, out var travelDate))
            return BadRequest("Invalid date format.");

        var results = await _service.SearchByStationAndDateAsync(from, to, travelDate);
        return Ok(results);
    }
}
