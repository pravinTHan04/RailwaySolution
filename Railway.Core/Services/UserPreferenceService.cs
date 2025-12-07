using Railway.Core.Models;
using Railway.Core.Data;
using Microsoft.EntityFrameworkCore;

public class UserPreferenceService
{
    private readonly RailwayDbContext _db;

    public UserPreferenceService(RailwayDbContext db)
    {
        _db = db;
    }

    // READ PREFERENCES
    public async Task<List<UserPreference>> GetPreferences(string userId)
    {
        return await _db.UserPreferences
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.BookingsCount)
            .ToListAsync();
    }

    // UPDATE PREFERENCE
    public async Task AddOrUpdatePreference(
        string userId,
        string trainType,
        string routeName,
        DateTime departureTime
    )
    {
        var timeText = departureTime.ToString("HH:mm");

        var pref = await _db.UserPreferences.FirstOrDefaultAsync(p =>
            p.UserId == userId &&
            p.TrainType == trainType &&
            p.RouteName == routeName
        );

        if (pref == null)
        {
            pref = new UserPreference
            {
                UserId = userId,
                TrainType = trainType,
                RouteName = routeName,
                PreferredTime = timeText,
                BookingsCount = 1,
                RouteCount = 1,
                LastUsedTimestamp = DateTime.UtcNow
            };

            _db.UserPreferences.Add(pref);
        }
        else
        {
            pref.BookingsCount++;
            pref.RouteCount++;
            pref.PreferredTime = timeText;               // UPDATE most recent
            pref.LastUsedTimestamp = DateTime.UtcNow;    // UPDATE time
        }

        await _db.SaveChangesAsync();
    }




    private string GetTimeOfDay(DateTime time)
    {
        int hour = time.Hour;

        if (hour < 12) return "Morning";
        if (hour < 18) return "Afternoon";
        return "Evening";
    }
}
