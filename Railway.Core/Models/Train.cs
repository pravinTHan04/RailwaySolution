namespace Railway.Core.Models
{
    public class Train
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; }

        public string TrainTypeId { get; set; }
        public TrainType TrainType { get; set; }
        public string? DefaultRouteId { get; set; }
        public RailRoute? DefaultRoute { get; set; }
        public ICollection<Carriage> Carriages { get; set; } = new List<Carriage>();
    }
}
