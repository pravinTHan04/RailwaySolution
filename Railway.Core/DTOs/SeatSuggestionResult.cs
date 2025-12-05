namespace Railway.Core.Models
{
    public class SeatSuggestionSeatDto
    {
        public string SeatId { get; set; } = string.Empty;
        public string SeatNumber { get; set; } = string.Empty;
        public string CarriageId { get; set; } = string.Empty;
        public int CarriageIndex { get; set; }
    }

    public class SeatSuggestionResult
    {
        public bool ExactMatch { get; set; }
        public string Reason { get; set; } = string.Empty;
        public List<SeatSuggestionSeatDto> Seats { get; set; } = new();
    }
}
