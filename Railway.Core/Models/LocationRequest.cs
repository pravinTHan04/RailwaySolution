public class WeatherApiResponse
{
    public Location location { get; set; }
    public Current current { get; set; }
}

public class Location
{
    public string name { get; set; }
    public string region { get; set; }
    public string country { get; set; }
}

public class Current
{
    public double temp_c { get; set; }
    public Condition condition { get; set; }
}

public class Condition
{
    public string text { get; set; }
    public string icon { get; set; }
    public int code { get; set; }
}

public class LocationRequest
{
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
