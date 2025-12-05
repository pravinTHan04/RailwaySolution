using Railway.Core.Models;

public class TrainType
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; }
    public decimal FareMultiplier { get; set; }
    public decimal SpeedFactor { get; set; }
    public bool StopsAtEveryStation { get; set; } 
    public string? Description { get; set; }

    public ICollection<Train> Trains { get; set; } = new List<Train>();
}
