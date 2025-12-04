namespace Railway.Core.Models;
public class ReservedSeat
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string BookingId { get; set; }
    public Booking Booking { get; set; }
    public string SeatId { get; set; }
    public Seat Seat { get; set; }
    public int FromStopOrder { get; set; }
    public int ToStopOrder { get; set; }
    public DateTime LockExpiresAt { get; set; }

}
