namespace Railway.Core.DTOs
{
    public class SearchScheduleRequest
    {
        public string FromStationId { get; set; }
        public string ToStationId { get; set; }
        public DateTime Date { get; set; }
    }

    public class ScheduleResultDto
    {
        public string ScheduleId { get; set; }
        public string Train { get; set; }
        public string Route { get; set; }
        public DateTime Departure { get; set; }
        public string Duration { get; set; }
        public List<string> Stops { get; set; }

        // NEW FIELDS ↓↓↓
        public string FromStation { get; set; }
        public string ToStation { get; set; }
        public int FromStopOrder { get; set; }
        public int ToStopOrder { get; set; }
    }
}
