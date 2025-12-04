using Railway.Core.Models;

public class Passenger
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string BookingId { get; set; }
    public Booking Booking { get; set; }
    public string? Phone { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
}
