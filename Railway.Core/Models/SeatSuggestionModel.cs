namespace Railway.Core.Models;

public class SeatSuggestionRequest
{
    public string ScheduleId { get; set; } = string.Empty;
    public int FromStopOrder { get; set; }
    public int ToStopOrder { get; set; }
    public int SeatCount { get; set; }
}

public class SeatSuggestionSeatResponse
{
    public string SeatId { get; set; } = string.Empty;
    public string SeatNumber { get; set; } = string.Empty;
    public string CarriageId { get; set; } = string.Empty;
    public int CarriageIndex { get; set; }
}

public class SeatSuggestionResponse
{
    public bool ExactMatch { get; set; }
    public string Reason { get; set; } = string.Empty;
    public List<SeatSuggestionSeatResponse> Seats { get; set; } = new();
}
