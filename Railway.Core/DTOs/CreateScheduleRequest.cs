namespace Railway.Core.DTOs
{
    public class CreateScheduleRequest
    {
        public string TrainId { get; set; }
        public string RouteId { get; set; }
        public DateTime DepartureTime { get; set; }
    }
}
