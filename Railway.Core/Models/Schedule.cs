namespace Railway.Core.Models;
public class Schedule
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TrainId { get; set; }
    public Train Train { get; set; }

    public string RouteId { get; set; }
    public RailRoute Route { get; set; }

    public DateTime DepartureTime { get; set; }
    public ICollection<ScheduleStop> Stops { get; set; } = new List<ScheduleStop>();
}
