using Microsoft.AspNetCore.Mvc;
using Railway.Core.DTOs;
using Railway.Core.Services.Interfaces;

namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/search")]
    public class SearchController : ControllerBase
    {
        private readonly IScheduleSearchService _service;

        public SearchController(IScheduleSearchService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Search([FromBody] SearchScheduleRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.FromStationId) || string.IsNullOrEmpty(request.ToStationId))
                return BadRequest("Invalid input");

            var results = await _service.SearchAsync(request);

            if (!results.Any())
                return NotFound(new { message = "No matching schedules found" });

            return Ok(results);
        }
    }
}
