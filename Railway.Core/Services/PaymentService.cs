using Railway.Core.Data;
using Railway.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace Railway.Core.Services
{
    public class PaymentService
    {
        private readonly RailwayDbContext _db;

        public PaymentService(RailwayDbContext db)
        {
            _db = db;
        }

        public async Task<Payment> CreatePaymentIntentAsync(string bookingId, decimal amount)
        {
            var payment = new Payment
            {
                BookingId = bookingId,
                Amount = amount,
                Status = PaymentStatus.Pending
            };

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            return payment;
        }

        public async Task<Payment> SimulateSuccessAsync(string paymentId)
        {
            var payment = await _db.Payments.Include(p => p.Booking).FirstOrDefaultAsync(p => p.Id == paymentId);

            if (payment == null)
                throw new Exception("Payment not found");

            payment.Status = PaymentStatus.Success;
            payment.PaidAt = DateTime.UtcNow;

            payment.Booking.Status = BookingStatus.Confirmed;

            await _db.SaveChangesAsync();
            return payment;
        }
    }
}
