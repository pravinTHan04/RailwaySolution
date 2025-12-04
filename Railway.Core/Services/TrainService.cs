using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.Models;

namespace Railway.Core.Services.Trains
{
    public class TrainService : ITrainService
    {
        private readonly RailwayDbContext _db;

        public TrainService(RailwayDbContext db)
        {
            _db = db;
        }

        public async Task<List<Train>> GetAllAsync() =>
            await _db.Trains.Include(t => t.Carriages).ToListAsync();

        public async Task<Train?> GetByIdAsync(string id) =>
            await _db.Trains.Include(t => t.Carriages).FirstOrDefaultAsync(t => t.Id == id);

        public async Task<Train> CreateAsync(string name, string trainTypeId)
        {
            var train = new Train 
            { 
                Name = name,
                TrainTypeId = trainTypeId
            };
            _db.Trains.Add(train);
            await _db.SaveChangesAsync();
            return train;
        }

        public async Task<bool> UpdateAsync(string id, string name)
        {
            var train = await _db.Trains.FindAsync(id);
            if (train == null) return false;

            train.Name = name;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var train = await _db.Trains.FindAsync(id);
            if (train == null) return false;

            _db.Trains.Remove(train);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<Carriage?> AddCarriageAsync(string trainId, int seatCount)
        {
            var train = await _db.Trains
                .Include(t => t.Carriages)
                .FirstOrDefaultAsync(t => t.Id == trainId);

            if (train == null) return null;

            int nextIndex = train.Carriages.Count + 1;

            var carriage = new Carriage
            {
                TrainId = train.Id,
                Index = nextIndex
            };

            _db.Carriages.Add(carriage);
            await _db.SaveChangesAsync();

            for (int i = 1; i <= seatCount; i++)
            {
                string seatCode = $"C{nextIndex}-{i.ToString("D2")}";

                _db.Seats.Add(new Seat
                {
                    CarriageId = carriage.Id,
                    SeatNumber = seatCode
                });
            }

            await _db.SaveChangesAsync();
            return carriage;
        }

    }
}
