public class UserPreference
{
    public string UserId { get; set; }

    public string TrainType { get; set; }
    public int BookingsCount { get; set; }

    public string RouteName { get; set; }
    public int RouteCount { get; set; }

    public string PreferredTime { get; set; }
    public DateTime LastUsedTimestamp { get; set; }
}
