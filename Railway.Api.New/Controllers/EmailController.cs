using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Railway.Core.Services.Interfaces;

namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailController : ControllerBase
    {
        private readonly IEmailService _email;

        public EmailController(IEmailService email)
        {
            _email = email;
        }

        [HttpPost("test-email")]
        public async Task<IActionResult> TestEmail(string email)
        {
            await _email.SendEmailAsync(email, "Test Email", "Your Railway email system is working!");
            return Ok(new { message = "Email sent successfully!" });
        }
    }
}
