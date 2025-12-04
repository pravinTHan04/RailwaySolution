using Microsoft.AspNetCore.Mvc;
using Railway.Core.Services;

namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _payments;

        public PaymentController(PaymentService payments)
        {
            _payments = payments;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment([FromBody] PaymentRequest request)
        {
            var payment = await _payments.CreatePaymentIntentAsync(request.BookingId, request.Amount);
            return Ok(payment);
        }

        [HttpPost("confirm/{paymentId}")]
        public async Task<IActionResult> ConfirmPayment(string paymentId)
        {
            var payment = await _payments.SimulateSuccessAsync(paymentId);
            return Ok(payment);
        }
    }

    public class PaymentRequest
    {
        public string BookingId { get; set; }
        public decimal Amount { get; set; }
    }
}
