using Railway.Core.DTOs;
using Railway.Core.Models;

namespace Railway.Core.Services.Interfaces
{
    public interface IScheduleService
    {
        Task<Schedule> GenerateScheduleAsync(string routeId, string trainId, DateTime departure);
        Task<List<Schedule>> GetSchedulesAsync();
        Task GenerateUpcomingSchedulesAsync(int daysAhead = 3);
        Task<List<ScheduleSearchResultDto>> SearchByStationAndDateAsync(string fromStationId, string toStationId, DateTime date);

    }
}
