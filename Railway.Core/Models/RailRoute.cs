using Railway.Core.Models;
using System.ComponentModel.DataAnnotations.Schema;

[Table("RailRoutes")]
public class RailRoute
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; }
    public ICollection<RouteStop> Stops { get; set; } = new List<RouteStop>();
}
