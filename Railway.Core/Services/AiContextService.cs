using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.Models;
using System.Text.Json;

public class AiContextService : IAiContextService
{
    private readonly RailwayDbContext _db;

    public AiContextService(RailwayDbContext db) => _db = db;

    public async Task SaveAsync(string userId, AiIntent intent)
    {
        var json = JsonSerializer.Serialize(intent);

        var context = await _db.AiContexts.FirstOrDefaultAsync(x => x.UserId == userId);

        if (context == null)
        {
            _db.AiContexts.Add(new UserAiContext { UserId = userId, IntentJson = json });
        }
        else
        {
            context.IntentJson = json;
            context.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }

    public async Task<AiIntent?> LoadAsync(string userId)
    {
        var existing = await _db.AiContexts.FirstOrDefaultAsync(x => x.UserId == userId);
        return existing == null ? null : JsonSerializer.Deserialize<AiIntent>(existing.IntentJson);
    }

    public async Task ClearAsync(string userId)
    {
        var row = await _db.AiContexts.FirstOrDefaultAsync(x => x.UserId == userId);
        if (row != null)
        {
            _db.AiContexts.Remove(row);
            await _db.SaveChangesAsync();
        }
    }
}
