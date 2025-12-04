using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.Models;

namespace Railway.Core.Services.Stations
{
    public class StationService : IStationService
    {
        private readonly RailwayDbContext _db;

        public StationService(RailwayDbContext db)
        {
            _db = db;
        }

        public async Task<List<Station>> GetAllAsync() =>
            await _db.Stations.ToListAsync();

        public async Task<Station?> GetByIdAsync(string id) =>
            await _db.Stations.FindAsync(id);

        public async Task<Station> CreateAsync(string name)
        {
            var station = new Station { Name = name };
            _db.Stations.Add(station);
            await _db.SaveChangesAsync();
            return station;
        }

        public async Task<bool> UpdateAsync(string id, string name)
        {
            var station = await _db.Stations.FindAsync(id);
            if (station == null) return false;

            station.Name = name;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var station = await _db.Stations.FindAsync(id);
            if (station == null) return false;

            _db.Stations.Remove(station);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
