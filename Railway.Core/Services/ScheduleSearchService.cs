using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.DTOs;
using Railway.Core.Models;
using Railway.Core.Services.Interfaces;
using System.ComponentModel.Design;

namespace Railway.Core.Services
{
    public class ScheduleSearchService : IScheduleSearchService
    {
        private readonly RailwayDbContext _db;
        private readonly UserPreferenceService _pref;

        public ScheduleSearchService
            (
            RailwayDbContext db,
            UserPreferenceService pref
            )
        {
            _db = db;
            _pref = pref;
        }

        public double ScoreSchedule(ScheduleResultDto schedule, List<UserPreference> prefs)
        {
            if (prefs == null || !prefs.Any())
                return 0;

            string trainType = schedule.TrainType;
            string routeName = schedule.Route;
            string depTime = schedule.Departure.ToString("HH:mm");

            var trainPref = prefs.FirstOrDefault(p => p.TrainType == trainType);
            var routePref = prefs.FirstOrDefault(p => p.RouteName == routeName);

            int maxTrainCount = prefs.Max(p => p.BookingsCount);
            int maxRouteCount = prefs.Max(p => p.RouteCount);

            double trainScore = trainPref == null ? 0 :
                (double)trainPref.BookingsCount / maxTrainCount;

            double routeScore = routePref == null ? 0 :
                (double)routePref.RouteCount / maxRouteCount;

            double timeScore = 0;
            if (trainPref != null && trainPref.PreferredTime == depTime)
                timeScore = 1;

            return (trainScore * 0.5) + (routeScore * 0.3) + (timeScore * 0.2);
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
            var prefs = await _pref.GetPreferences(request.UserId);

            var schedules = await _db.Schedules
                .Include(s => s.Route)
                    .ThenInclude(r => r.Stops)
                        .ThenInclude(rs => rs.Station)
                .Include(s => s.Train)
                    .ThenInclude(t => t.TrainType)   // ✔ CORRECT
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

                    var trainType = s.Train?.TrainType?.Name ?? "Unknown";
                    var fareMultiplier = s.Train?.TrainType?.FareMultiplier ?? 1.0m;
                    var speedFactor = (double)(s.Train?.TrainType?.SpeedFactor ?? 1.0m);

                    return new ScheduleResultDto
                    {
                        ScheduleId = s.Id,
                        Train = s.Train.Name,
                        Route = s.Route.Name,
                        Departure = s.DepartureTime,
                        TrainType = s.Train.TrainType?.Name,
                        Price = durationStops * fareMultiplier,
                        TravelTime = (int)(durationStops * (speedFactor * 10)),
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

            foreach (var r in results)
            {
                r.Score = ScoreSchedule(r, prefs);
            }

            return results;
        }

        public async Task<List<ScheduleResultDto>> SearchWithPreferencesAsync(SearchScheduleRequest request, string userId)
        {
            // 1) Get schedules using the existing method
            var schedules = await SearchAsync(request);

            // 2) Load user preferences
            var prefs = await _db.UserPreferences
                .Where(p => p.UserId == userId)
                .ToListAsync();

            if (!prefs.Any())
                return schedules; // no personalization possible

            // 3) Apply weighting
            var weighted = schedules
                .Select(s => new
                {
                    result = s,
                    score = ScoreSchedule(s, prefs)
                })
                .OrderByDescending(x => x.score)
                .Select(x => x.result)
                .ToList();

            return weighted;
        }

    }
}
