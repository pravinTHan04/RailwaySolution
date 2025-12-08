namespace Railway.Core.DTOs
{
    public class ScheduleSearchResultDto
    {
        public string Id { get; set; }

        public TrainDto Train { get; set; }
        public RouteDto Route { get; set; }

        public DateTime DepartureTime { get; set; }
        public int FromStopOrder { get; set; }
        public int ToStopOrder { get; set; }

    }

    public class TrainDto
    {
        public string Name { get; set; }
        public TrainTypeDto TrainType { get; set; }
    }

    public class TrainTypeDto
    {
        public string Name { get; set; }
    }

    public class RouteDto
    {
        public string Name { get; set; }
    }
}
