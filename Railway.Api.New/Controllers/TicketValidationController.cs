using Microsoft.AspNetCore.Mvc;
using Railway.Core.Services.Interfaces;

namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/ticket")]
    public class TicketValidationController : ControllerBase
    {
        private readonly ITicketValidationService _validator;

        public TicketValidationController(ITicketValidationService validator)
        {
            _validator = validator;
        }

        [HttpPost("validate")]
        public async Task<IActionResult> Validate([FromBody] ValidateQrRequest request)
        {
            var result = await _validator.ValidateAsync(request.QrData);
            return Ok(result);
        }
    }

    public class ValidateQrRequest
    {
        public string QrData { get; set; }
    }
}
