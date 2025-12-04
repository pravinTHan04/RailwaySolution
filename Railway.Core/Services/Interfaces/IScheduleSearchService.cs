using Railway.Core.DTOs;
using Railway.Core.Models;

namespace Railway.Core.Services.Interfaces
{
    public interface IScheduleSearchService
    {
        Task<List<ScheduleResultDto>> SearchAsync(SearchScheduleRequest request);
        Task<Station?> GetStationByNameAsync(string name);
        Task<List<string>> GetAllStationNamesAsync();

    }
}
