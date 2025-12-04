using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.DTOs;
using Railway.Core.Models;
using Railway.Core.Services.Interfaces;

namespace Railway.Core.Services
{
    public class ScheduleSearchService : IScheduleSearchService
    {
        private readonly RailwayDbContext _db;

        public ScheduleSearchService(RailwayDbContext db)
        {
            _db = db;
        }
        public async Task<Station?> GetStationByNameAsync(string name)
        {
            return await _db.Stations
                .FirstOrDefaultAsync(s => s.Name.ToLower() == name.ToLower());
        }

        public async Task<List<string>> GetAllStationNamesAsync()
        {
            return await _db.Stations
                .Select(s => s.Name)
                .OrderBy(name => name)
                .ToListAsync();
        }


        public async Task<List<ScheduleResultDto>> SearchAsync(SearchScheduleRequest request)
        {
            var schedules = await _db.Schedules
                .Include(s => s.Route)
                    .ThenInclude(r => r.Stops)
                        .ThenInclude(rs => rs.Station)
                .Include(s => s.Train)
                .Where(s => s.DepartureTime.Date == request.Date.Date)
                .ToListAsync();

            var results = schedules
                .Where(s =>
                    s.Route.Stops.Any(x => x.StationId == request.FromStationId) &&
                    s.Route.Stops.Any(x => x.StationId == request.ToStationId) &&
                    s.Route.Stops.First(x => x.StationId == request.FromStationId).Order <
                    s.Route.Stops.First(x => x.StationId == request.ToStationId).Order
                )
                .Select(s =>
                {
                    var fromStop = s.Route.Stops.First(x => x.StationId == request.FromStationId);
                    var toStop = s.Route.Stops.First(x => x.StationId == request.ToStationId);

                    var durationStops = toStop.Order - fromStop.Order;

                    return new ScheduleResultDto
                    {
                        ScheduleId = s.Id,
                        Train = s.Train.Name,
                        Route = s.Route.Name,
                        Departure = s.DepartureTime,
                        Duration = $"{durationStops} stops",
                        Stops = s.Route.Stops
                            .OrderBy(x => x.Order)
                            .Select(rs => rs.Station?.Name ?? "(Unknown Station)")
                            .ToList(),
                        FromStation = fromStop.Station.Name,
                        ToStation = toStop.Station.Name,
                        FromStopOrder = fromStop.Order,
                        ToStopOrder = toStop.Order
                    };
                })
                .ToList();

            return results;
        }
    }
}
