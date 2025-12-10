using Railway.Core.Models;

namespace Railway.Core.Services.Interfaces
{
    public interface IBookingService
    {
        Task<Booking> CreatePendingBookingAsync(string scheduleId, string UserId, string passengerName, List<string> seatIds, int fromStopOrder, int toStopOrder);
        Task<Booking?> GetBookingByIdAsync(string bookingId);
        Task<Booking> ConfirmBookingAsync(string bookingId);
        Task CancelBookingAsync(string bookingId);
        Task<List<Booking>> GetBookingsForScheduleAsync(string scheduleId);
        Task<Ticket?> GetTicketByBookingIdAsync(string bookingId);
        Task ResendTicketAsync(string bookingId);


    }
}
