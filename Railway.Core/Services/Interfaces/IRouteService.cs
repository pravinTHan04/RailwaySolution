using Railway.Core.Models;

namespace Railway.Core.Services.Routes
{
    public interface IRouteService
    {
        Task<RailRoute> CreateRouteAsync(string name);
        Task<RailRoute?> GetRouteAsync(string id);
        Task<List<RailRoute>> GetAllRoutesAsync();
        Task<RouteStop?> AddStopAsync(string routeId, string stationId, int order, int travelMinutes);
        Task<bool> DeleteAsync(string routeId);
    }
}
