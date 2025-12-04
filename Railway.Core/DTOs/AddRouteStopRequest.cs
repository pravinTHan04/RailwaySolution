namespace Railway.Core.DTOs
{
    public class AddRouteStopRequest
    {
        public string StationId { get; set; }
        public int Order { get; set; }
        public int TravelMinutesFromPrevious { get; set; }
    }
}
