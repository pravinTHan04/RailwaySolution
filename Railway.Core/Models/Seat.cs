namespace Railway.Core.Models;
public class Seat
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SeatNumber { get; set; } // e.g. A12, B04
    public string CarriageId { get; set; }
    public Carriage Carriage { get; set; }
}
