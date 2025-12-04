using Railway.Core.Models;

namespace Railway.Core.Services.Trains
{
    public interface ITrainService
    {
        Task<List<Train>> GetAllAsync();
        Task<Train?> GetByIdAsync(string id);
        Task<Train> CreateAsync(string name, string trainTypeId);
        Task<bool> UpdateAsync(string id, string name);
        Task<bool> DeleteAsync(string id);
        Task<Carriage?> AddCarriageAsync(string trainId, int seatCount);
    }
}
