namespace Railway.Core.Models;
public class Seat
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SeatNumber { get; set; } 
    public string CarriageId { get; set; }
    public Carriage Carriage { get; set; }
}
