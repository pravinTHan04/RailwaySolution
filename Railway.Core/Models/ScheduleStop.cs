namespace Railway.Core.Models;
public class ScheduleStop
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string ScheduleId { get; set; }
    public Schedule Schedule { get; set; }

    public string StationId { get; set; }
    public Station Station { get; set; }

    public DateTime Arrival { get; set; }
    public DateTime Departure { get; set; }

    public int Order { get; set; }
}
