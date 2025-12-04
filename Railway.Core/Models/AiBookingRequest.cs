public class AiBookingRequest
{
    public string ScheduleId { get; set; }
    public List<string> SeatIds { get; set; } = new();
    public string PassengerName { get; set; }
    public string Email { get; set; }

    public int FromStopOrder { get; set; }
    public int ToStopOrder { get; set; }

}
