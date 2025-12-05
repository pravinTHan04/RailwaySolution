using Railway.Core.Models;

public interface ISeatAllocationService
{
    Task GenerateCarriagesForTrainAsync(string trainId, int carriageCount = 4);
    Task GenerateSeatsForTrainAsync(string trainId, int seatsPerCarriage = 40);

    Task<List<ReservedSeat>> LockSeatsAsync(string scheduleId, List<string> seatIds, int fromStopOrder, int toStopOrder, string tempUserToken);
    Task ReleaseExpiredLocksAsync();
    Task<bool> UnlockSeatsAsync(string scheduleId, List<string> seatIds);
    Task<List<CarriageSeatGroup>> GetAvailableSeatsAsync(string scheduleId, int fromStopOrder, int toStopOrder);
    Task<SeatSuggestionResult> SuggestSeatsAsync(string scheduleId, int fromStopOrder, int toStopOrder, int seatCount);

}
