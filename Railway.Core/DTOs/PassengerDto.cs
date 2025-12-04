public class PassengerInfoRequest
{
    public string BookingId { get; set; }
    public List<PassengerDto> Passengers { get; set; } = new();
}

public class PassengerDto
{
    public string FullName { get; set; }
    public string Email { get; set; }
}
