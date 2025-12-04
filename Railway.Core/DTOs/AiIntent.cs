public class AiIntent
{
    public string Intent { get; set; }          // "search_schedule" | "book" | "cancel" ...
    public string From { get; set; }           // station name
    public string To { get; set; }             // station name
    public string Date { get; set; }           // "YYYY-MM-DD"
    public string Time { get; set; }           // e.g. "08:00", "morning", "evening"
    public string TrainType { get; set; }      // e.g. "express", "intercity", "normal"

    // Optional booking-related (for later if you want AI to handle them too)
    public int? SeatCount { get; set; }
    public string PassengerName { get; set; }
    public string Email { get; set; }

    // List of which fields are missing from the user's last message
    public List<string> Missing { get; set; } = new();
}
