using Railway.Core.Models;
public interface IAiContextService
{
    Task SaveAsync(string userId, AiIntent intent);
    Task<AiIntent?> LoadAsync(string userId);
    Task ClearAsync(string userId);
}
