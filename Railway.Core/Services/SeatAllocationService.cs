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
                            SeatNumber = $"{letter}{row:00}" 
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
                    Index = i 
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
                        continue;
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

        public async Task<SeatSuggestionResult> SuggestSeatsAsync(
            string scheduleId,
            int fromStopOrder,
            int toStopOrder,
            int seatCount)
        {
            var result = new SeatSuggestionResult();

            await ReleaseExpiredLocksAsync();

            var schedule = await _db.Schedules
                .Include(s => s.Train)
                    .ThenInclude(t => t.Carriages)
                .FirstOrDefaultAsync(s => s.Id == scheduleId);

            if (schedule == null)
            {
                result.Reason = "Schedule not found.";
                return result;
            }

            var availability = await GetAvailableSeatsAsync(
                scheduleId, fromStopOrder, toStopOrder
            ); 

            var allAvailable = availability
                .SelectMany(cg => cg.Seats.Select(s => new
                {
                    Seat = s,               
                    CarriageIndex = cg.Carriage
                }))
                .Where(x => x.Seat.Status == "available")
                .ToList();

            if (!allAvailable.Any())
            {
                result.Reason = "No seats available for this segment.";
                return result;
            }

            var candidates = new List<SeatGroupCandidate>();

            foreach (var carriageGroup in availability.OrderBy(cg => cg.Carriage))
            {
                var seatsInCarriage = carriageGroup.Seats
                    .Where(s => s.Status == "available")
                    .Select(s => new
                    {
                        Seat = s,
                        CarriageIndex = carriageGroup.Carriage,
                        Row = int.Parse(s.SeatNumber.Substring(1)), 
                        Letter = s.SeatNumber.Substring(0, 1)       
                    })
                    .OrderBy(s => s.Row)
                    .ThenBy(s => s.Letter)
                    .ToList();

                if (seatsInCarriage.Count < seatCount)
                    continue;

                for (int i = 0; i <= seatsInCarriage.Count - seatCount; i++)
                {
                    var window = seatsInCarriage
                        .Skip(i)
                        .Take(seatCount)
                        .ToList();

                    bool sameRow = window.All(x => x.Row == window[0].Row);
                    bool consecutiveLetters = AreLettersConsecutive(
                        window.Select(x => x.Letter).ToList()
                    );
                    bool contiguous = sameRow && consecutiveLetters;

                    int score = 0;
                    if (contiguous) score += 50;                 
                    score += (10 - carriageGroup.Carriage);      
                    score += seatCount * 5;                      

                    var dtoSeats = window.Select(x => new SeatSuggestionSeatDto
                    {
                        SeatId = x.Seat.SeatId,
                        SeatNumber = x.Seat.SeatNumber,
                        CarriageId = x.Seat.CarriageId,
                        CarriageIndex = x.CarriageIndex
                    }).ToList();

                    candidates.Add(new SeatGroupCandidate
                    {
                        Seats = dtoSeats,
                        Score = score,
                        Contiguous = contiguous,
                        CarriageIndex = carriageGroup.Carriage
                    });
                }
            }

            if (!candidates.Any())
            {
                var fallbackSeats = allAvailable
                    .OrderBy(x => x.CarriageIndex)
                    .ThenBy(x => int.Parse(x.Seat.SeatNumber.Substring(1)))  
                    .ThenBy(x => x.Seat.SeatNumber.Substring(0, 1))          
                    .Take(seatCount)
                    .Select(x => new SeatSuggestionSeatDto
                    {
                        SeatId = x.Seat.SeatId,
                        SeatNumber = x.Seat.SeatNumber,
                        CarriageId = x.Seat.CarriageId,
                        CarriageIndex = x.CarriageIndex
                    })
                    .ToList();

                result.Seats = fallbackSeats;
                result.ExactMatch = false;
                result.Reason = "No contiguous group found. Returning closest available seats.";
                return result;
            }

            var best = candidates
                .OrderByDescending(c => c.Score)
                .First();

            result.Seats = best.Seats;
            result.ExactMatch = best.Contiguous;
            result.Reason = best.Contiguous
                ? "Contiguous seat group found."
                : "Best available group found (not perfectly contiguous).";

            return result;
        }


        private bool AreLettersConsecutive(List<string> letters)
        {
            var nums = letters.Select(l => (int)l[0]).ToList();
            nums.Sort();

            for (int i = 0; i < nums.Count - 1; i++)
            {
                if (nums[i + 1] != nums[i] + 1)
                    return false;
            }

            return true;
        }



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

            var expiredBookings = await _db.Bookings
                .Where(b =>
                    b.Status == BookingStatus.Pending &&
                    b.ExpiresAt != null &&
                    b.ExpiresAt < now)
                .Include(b => b.ReservedSeats)
                .ToListAsync();

            if (expiredBookings.Any())
            {
                _db.ReservedSeats.RemoveRange(expiredBookings.SelectMany(b => b.ReservedSeats));

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
internal class SeatGroupCandidate
{
    public List<SeatSuggestionSeatDto> Seats { get; set; } = new();
    public int Score { get; set; }
    public bool Contiguous { get; set; }
    public int CarriageIndex { get; set; }
}
