namespace Railway.Core.Models
{
    public class UserAiContext
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } 
        public string IntentJson { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
