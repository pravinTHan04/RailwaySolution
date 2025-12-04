using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.Models;

namespace Railway.Core.Services.Routes
{
    public class RouteService : IRouteService
    {
        private readonly RailwayDbContext _db;

        public RouteService(RailwayDbContext db)
        {
            _db = db;
        }

        public async Task<RailRoute> CreateRouteAsync(string name)
        {
            var route = new RailRoute { Name = name };
            _db.Routes.Add(route);
            await _db.SaveChangesAsync();
            return route;
        }

        public async Task<RailRoute?> GetRouteAsync(string id) =>
            await _db.Routes
                .Include(r => r.Stops)
                    .ThenInclude(s => s.Station)
                .OrderBy(r => r.Name)
                .FirstOrDefaultAsync(r => r.Id == id);

        public async Task<List<RailRoute>> GetAllRoutesAsync() =>
            await _db.Routes
                .Include(r => r.Stops)
                    .ThenInclude(s => s.Station)
                .ToListAsync();

        public async Task<RouteStop?> AddStopAsync(string routeId, string stationId, int order, int travelMinutes)
        {
            var route = await _db.Routes.FindAsync(routeId);
            if (route == null) return null;

            var stop = new RouteStop
            {
                RouteId = routeId,
                StationId = stationId,
                Order = order,
                TravelTimeFromPrevious = TimeSpan.FromMinutes(travelMinutes)
            };

            _db.RouteStops.Add(stop);
            await _db.SaveChangesAsync();
            return stop;
        }

        public async Task<bool> DeleteAsync(string routeId)
        {
            var route = await _db.Routes.FindAsync(routeId);
            if (route == null) return false;

            _db.Routes.Remove(route);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
