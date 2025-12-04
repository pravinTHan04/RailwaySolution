using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.DTOs;
using Railway.Core.Models;
using Railway.Core.Services.Interfaces;

namespace Railway.Core.Services
{
    public class ScheduleService : IScheduleService
    {
        private readonly RailwayDbContext _db;

        public ScheduleService(RailwayDbContext db)
        {
            _db = db;
        }

        public async Task<List<Schedule>> GetSchedulesAsync() =>
            await _db.Schedules
                .Include(s => s.Train)
                    .ThenInclude(t => t.TrainType)
                .Include(s => s.Route)
                .Include(s => s.Stops)
                    .ThenInclude(st => st.Station)
                .ToListAsync();
        public async Task GenerateUpcomingSchedulesAsync(int daysAhead = 3)
        {
            var routes = await _db.Routes.Include(r => r.Stops).ToListAsync();
            var trains = await _db.Trains.Include(t => t.TrainType).ToListAsync();

            var today = DateTime.Today;

            for (int d = 0; d < daysAhead; d++)
            {
                var date = today.AddDays(d);

                foreach (var train in trains.Where(t => t.DefaultRouteId != null))
                {
                    var route = routes.First(r => r.Id == train.DefaultRouteId);

                    bool exists = await _db.Schedules.AnyAsync(s =>
                        s.RouteId == route.Id &&
                        s.TrainId == train.Id &&
                        s.DepartureTime.Date == date.Date);

                    if (exists) continue;

                    int routeIndex = routes.IndexOf(route);
                    int trainIndex = trains.IndexOf(train);

                    var schedule = new Schedule
                    {
                        RouteId = route.Id,
                        TrainId = train.Id,
                        DepartureTime = date
                            .AddHours(6 + routeIndex * 2)
                            .AddMinutes(trainIndex * 20)
                    };

                    _db.Schedules.Add(schedule);
                    await _db.SaveChangesAsync();

                    DateTime cursor = schedule.DepartureTime;
                    double speed = Convert.ToDouble(train.TrainType.SpeedFactor);

                    foreach (var stop in route.Stops.OrderBy(s => s.Order))
                    {
                        var arrival = cursor;
                        var departure = stop.Order == 1 ? cursor : cursor.AddMinutes(2);

                        _db.ScheduleStops.Add(new ScheduleStop
                        {
                            ScheduleId = schedule.Id,
                            StationId = stop.StationId,
                            Order = stop.Order,
                            Arrival = arrival,
                            Departure = departure
                        });

                        double travelMinutes = stop.TravelTimeFromPrevious.TotalMinutes * speed;
                        cursor = departure.AddMinutes(travelMinutes);
                    }

                    await _db.SaveChangesAsync();
                }
            }
        }
        public async Task<Schedule> GenerateScheduleAsync(string routeId, string trainId, DateTime departure)
        {
            var route = await _db.Routes
                .Include(r => r.Stops)
                .ThenInclude(s => s.Station)
                .FirstOrDefaultAsync(r => r.Id == routeId);

            var train = await _db.Trains
                .Include(t => t.TrainType)
                .FirstOrDefaultAsync(t => t.Id == trainId);

            if (route == null || train == null)
                throw new Exception("Train or Route not found.");

            var schedule = new Schedule
            {
                RouteId = route.Id,
                TrainId = train.Id,
                DepartureTime = departure
            };

            _db.Schedules.Add(schedule);
            await _db.SaveChangesAsync();

            DateTime cursor = departure;
            var speed = train.TrainType?.SpeedFactor ?? 1.0m;

            foreach (var stop in route.Stops.OrderBy(s => s.Order))
            {
                var arrival = cursor;
                var departureTime = stop.Order == 1 ? cursor : cursor.AddMinutes(2);

                _db.ScheduleStops.Add(new ScheduleStop
                {
                    ScheduleId = schedule.Id,
                    StationId = stop.StationId,
                    Order = stop.Order,
                    Arrival = arrival,
                    Departure = departureTime
                });

                // apply travel time with correct type conversion
                double travelMinutes = stop.TravelTimeFromPrevious.TotalMinutes * Convert.ToDouble(speed);
                cursor = departureTime.AddMinutes(travelMinutes);
            }

            await _db.SaveChangesAsync();
            return schedule;
        }

        public async Task<List<ScheduleSearchResultDto>> SearchByStationAndDateAsync(
     string fromStationId, string toStationId, DateTime date)
        {
            var schedules = await _db.Schedules
                .Include(s => s.Train)
                .Include(s => s.Route)
                .Include(s => s.Stops)
                .Where(s =>
                    s.DepartureTime.Date == date.Date &&
                    s.Stops.Any(st => st.StationId == fromStationId) &&
                    s.Stops.Any(st => st.StationId == toStationId))
                .ToListAsync();

            var list = new List<ScheduleSearchResultDto>();

            foreach (var s in schedules)
            {
                var fromStop = s.Stops.First(st => st.StationId == fromStationId);
                var toStop = s.Stops.First(st => st.StationId == toStationId);

                list.Add(new ScheduleSearchResultDto
                {
                    Id = s.Id,
                    Train = new TrainDto
                    {
                        Name = s.Train.Name,
                        TrainType = new TrainTypeDto
                        {
                            Name = s.Train.TrainType?.Name
                        }
                    },
                    Route = new RouteDto
                    {
                        Name = s.Route.Name
                    },
                    DepartureTime = s.DepartureTime,
                    FromStopOrder = fromStop.Order,
                    ToStopOrder = toStop.Order
                });

            }

            return list;
        }


    }

}
