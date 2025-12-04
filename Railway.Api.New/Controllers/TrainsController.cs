using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Railway.Core.DTOs;
using Railway.Core.Models;
using Railway.Core.Services.Trains;


namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrainsController : ControllerBase
    {
        private readonly ITrainService _service;

        public TrainsController(ITrainService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _service.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var train = await _service.GetByIdAsync(id);
            return train == null ? NotFound() : Ok(train);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTrainRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Train name is required.");
            if (string.IsNullOrWhiteSpace(request.TrainTypeId))
                return BadRequest("TrainTypeId is required.");

            var created = await _service.CreateAsync(request.Name, request.TrainTypeId);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Train request)
        {
            var updated = await _service.UpdateAsync(id, request.Name);
            return updated ? NoContent() : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var deleted = await _service.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
