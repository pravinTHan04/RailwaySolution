using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Railway.Core.DTOs;
using Railway.Core.Services.Routes;

namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoutesController : ControllerBase
    {
        private readonly IRouteService _service;

        public RoutesController(IRouteService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _service.GetAllRoutesAsync());


        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateRoute(CreateRouteRequest request)
        {
            var route = await _service.CreateRouteAsync(request.Name);
            return Ok(route);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{routeId}/stops")]
        public async Task<IActionResult> AddStop(string routeId, AddRouteStopRequest request)
        {
            var stop = await _service.AddStopAsync(routeId, request.StationId, request.Order, request.TravelMinutesFromPrevious);
            return stop == null ? NotFound("Route not found") : Ok(stop);
        }
    }
}
