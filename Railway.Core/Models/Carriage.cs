namespace Railway.Core.Models
{
    public class Carriage
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public int Index { get; set; }

        public string TrainId { get; set; }
        public Train Train { get; set; }

        public ICollection<Seat> Seats { get; set; } = new List<Seat>();

        public string DisplayName => $"Carriage {Index}";
    }
}
