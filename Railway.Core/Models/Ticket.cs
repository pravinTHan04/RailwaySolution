using Railway.Core.Models;

public class Ticket
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string BookingId { get; set; }
    public Booking Booking { get; set; }

    public string TicketNumber { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public string? QrCodeBase64 { get; set; }
    public string? QrFilePath { get; set; }
    public bool IsUsed { get; set; } = false;

}
