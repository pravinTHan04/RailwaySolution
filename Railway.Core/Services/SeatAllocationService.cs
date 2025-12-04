using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.Models;
using Railway.Core.Services.Interfaces;


namespace Railway.Core.Services
{
    public class SeatAllocationService : ISeatAllocationService
    {
        private readonly RailwayDbContext _db;
        public SeatAllocationService(RailwayDbContext db)
        {
            _db = db;
        }


        public async Task GenerateSeatsForTrainAsync(string trainId, int seatsPerCarriage = 40)
        {
            if (_db.Seats.Any(s => s.Carriage.TrainId == trainId))
                return;

            var train = await _db.Trains
                .Include(t => t.Carriages)
                    .ThenInclude(c => c.Seats)
                .FirstOrDefaultAsync(t => t.Id == trainId);

            if (train == null)
                throw new Exception("Train not found.");

            foreach (var carriage in train.Carriages.OrderBy(c => c.Index))
            {
                if (carriage.Seats.Any())
                    continue;

                int rows = seatsPerCarriage / 4;
                string[] letters = { "A", "B", "C", "D" };

                for (int row = 1; row <= rows; row++)
                {
                    foreach (var letter in letters)
                    {
                        carriage.Seats.Add(new Seat
                        {
                            Id = Guid.NewGuid().ToString(),
                            CarriageId = carriage.Id,
                            SeatNumber = $"{letter}{row:00}" // A01, A02, etc.
                        });
                    }
                }
            }

            await _db.SaveChangesAsync();
        }

        public async Task GenerateCarriagesForTrainAsync(string trainId, int carriageCount = 4)
        {
            if (_db.Carriages.Any(c => c.TrainId == trainId))
                return;

            var train = await _db.Trains
                .Include(t => t.Carriages)
                .FirstOrDefaultAsync(t => t.Id == trainId);

            if (train == null)
                throw new Exception("Train not found.");

            for (int i = 1; i <= carriageCount; i++)
            {
                train.Carriages.Add(new Carriage
                {
                    Id = Guid.NewGuid().ToString(),
                    TrainId = trainId,
                    Index = i // instead of carriageNumber
                });
            }

            await _db.SaveChangesAsync();
        }


        // Returns seats still free for this trip segment
        public async Task<List<CarriageSeatGroup>> GetAvailableSeatsAsync(string scheduleId, int fromStopOrder, int toStopOrder)
        {

            await ReleaseExpiredLocksAsync();


            var schedule = await _db.Schedules
                .Include(s => s.Train)
                    .ThenInclude(t => t.Carriages)
                        .ThenInclude(c => c.Seats)
                .FirstOrDefaultAsync(s => s.Id == scheduleId);

            if (schedule == null)
                throw new Exception("Schedule not found");

            var allSeats = schedule.Train.Carriages.SelectMany(c => c.Seats).ToList();

            var reservedSeats = await _db.ReservedSeats
    .Include(rs => rs.Booking)
    .Where(rs => rs.Booking.ScheduleId == scheduleId &&
                 rs.FromStopOrder < toStopOrder &&
                 rs.ToStopOrder > fromStopOrder)
    .ToListAsync();

            var now = DateTime.UtcNow;

            var result = new List<SeatAvailabilityDto>();

            foreach (var seat in allSeats)
            {
                var r = reservedSeats.FirstOrDefault(x => x.SeatId == seat.Id);

                string status = "available";

                if (r != null)
                {
                    if (r.Booking.Status == BookingStatus.Confirmed)
                        status = "booked";
                    else if (r.LockExpiresAt > now)
                        status = "held";
                    else
                        continue; // expired lock → treat as available
                }

                result.Add(new SeatAvailabilityDto
                {
                    SeatId = seat.Id,
                    SeatNumber = seat.SeatNumber,
                    Status = status,
                    CarriageId = seat.CarriageId
                });



            }
            return schedule.Train.Carriages
    .OrderBy(c => c.Index)
    .Select(c => new CarriageSeatGroup
    {
        Carriage = c.Index,
        Seats = result
            .Where(s => s.CarriageId == c.Id)
            .OrderBy(s => s.SeatNumber)
            .ToList()
    })
    .ToList();

        }

        // Creates a pending booking and locks the seats
        public async Task<List<ReservedSeat>> LockSeatsAsync(
            string scheduleId,
            List<string> seatIds,
            int fromStopOrder,
            int toStopOrder,
            string tempUserToken)
        {
            var booking = new Booking
            {
                ScheduleId = scheduleId,
                PassengerName = tempUserToken,
                Status = BookingStatus.Pending,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5)
            };

            foreach (var seatId in seatIds)
            {
                booking.ReservedSeats.Add(new ReservedSeat
                {
                    SeatId = seatId,
                    FromStopOrder = fromStopOrder,
                    ToStopOrder = toStopOrder,
                    LockExpiresAt = DateTime.UtcNow.AddMinutes(5)
                });
            }

            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();

            return await _db.ReservedSeats
                .Where(rs => rs.BookingId == booking.Id)
                .Include(rs => rs.Seat)
                .ToListAsync();
        }

        public async Task ReleaseExpiredLocksAsync()
        {
            var now = DateTime.UtcNow;

            // Find bookings that are pending AND expired
            var expiredBookings = await _db.Bookings
                .Where(b =>
                    b.Status == BookingStatus.Pending &&
                    b.ExpiresAt != null &&
                    b.ExpiresAt < now)
                .Include(b => b.ReservedSeats)
                .ToListAsync();

            if (expiredBookings.Any())
            {
                // Remove reserved seats tied to expired bookings
                _db.ReservedSeats.RemoveRange(expiredBookings.SelectMany(b => b.ReservedSeats));

                // Mark booking as expired (optional but logical)
                foreach (var booking in expiredBookings)
                    booking.Status = BookingStatus.Expired;

                await _db.SaveChangesAsync();
            }
        }

        public async Task<bool> UnlockSeatsAsync(string scheduleId, List<string> seatIds)
{
    var reserved = await _db.ReservedSeats
        .Include(r => r.Booking)
        .Where(r => r.Booking.ScheduleId == scheduleId &&
                    seatIds.Contains(r.SeatId) &&
                    r.Booking.Status == BookingStatus.Pending)
        .ToListAsync();

    if (!reserved.Any())
        return false;

    var affectedBookings = reserved.Select(r => r.Booking).Distinct().ToList();

    _db.ReservedSeats.RemoveRange(reserved);

    // If any booking has no seats left → mark expired
    foreach (var booking in affectedBookings)
    {
        await _db.Entry(booking).Collection(b => b.ReservedSeats).LoadAsync();

        if (!booking.ReservedSeats.Any())
            booking.Status = BookingStatus.Expired;
    }

    await _db.SaveChangesAsync();
    return true;
}

    }
}
