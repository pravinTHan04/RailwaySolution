namespace Railway.Core.Models;
public class Booking
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ScheduleId { get; set; }
    public Schedule Schedule { get; set; }

    public string PassengerName { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;

    public ICollection<ReservedSeat> ReservedSeats { get; set; } = new List<ReservedSeat>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public virtual List<Passenger> Passengers { get; set; } = new();


}
