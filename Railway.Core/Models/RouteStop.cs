namespace Railway.Core.Models
{
    public class RouteStop
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string RouteId { get; set; }
        public RailRoute Route { get; set; }   // <-- REQUIRED navigation property

        public string StationId { get; set; }
        public Station Station { get; set; }

        public int Order { get; set; } // Order in route
        public TimeSpan TravelTimeFromPrevious { get; set; }
        public decimal DistanceFromPreviousKm { get; set; }
    }
}
