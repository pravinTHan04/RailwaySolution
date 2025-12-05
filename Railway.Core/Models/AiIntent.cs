namespace Railway.Core.Models
{
    public class AiIntent
    {
        public string Intent { get; set; } = "";
        public string From { get; set; } = "";
        public string To { get; set; } = "";
        public string Date { get; set; } = "";
        public string Time { get; set; } = "";
        public string TrainType { get; set; } = "";
        public int? SeatCount { get; set; }
        public string PassengerName { get; set; } = "";
        public string Email { get; set; } = "";
        public string SortBy { get; set; } = "";
        public List<string> Missing { get; set; } = new();
    }
}
