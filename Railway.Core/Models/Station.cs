namespace Railway.Core.Models;
public class Station
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; }
}
