using Railway.Core.Models;

public class Payment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string BookingId { get; set; }
    public Booking Booking { get; set; }

    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
}

public enum PaymentStatus
{
    Pending,
    Success,
    Failed
}
