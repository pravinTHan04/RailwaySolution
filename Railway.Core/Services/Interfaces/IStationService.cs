using Railway.Core.Models;

namespace Railway.Core.Services.Stations
{
    public interface IStationService
    {
        Task<List<Station>> GetAllAsync();
        Task<Station?> GetByIdAsync(string id);
        Task<Station> CreateAsync(string name);
        Task<bool> UpdateAsync(string id, string name);
        Task<bool> DeleteAsync(string id);
    }
}
