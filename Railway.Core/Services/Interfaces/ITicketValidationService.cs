namespace Railway.Core.Services.Interfaces
{
    public interface ITicketValidationService
    {
        Task<TicketValidationResult> ValidateAsync(string qrData);
    }

    public class TicketValidationResult
    {
        public bool Valid { get; set; }
        public string Message { get; set; }

        public string? Passenger { get; set; }
        public string? Train { get; set; }
        public string? Route { get; set; }
        public DateTime? Departure { get; set; }

        public IEnumerable<string>? Seats { get; set; }
        public string? TicketNumber { get; set; }
        public string? Status { get; set; }
    }
}
