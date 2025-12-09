namespace Railway.Core.Models
{
    public class DelayPredictionResult
    {
        // True if we expect any meaningful delay
        public bool IsDelayed { get; set; }

        // Expected delay in minutes (0 means "on time")
        public int ExpectedDelayMinutes { get; set; }

        // 0.0 – 1.0 (how confident our rule-based predictor is)
        public double Confidence { get; set; }

        // Human-readable explanation (for debugging / AI messages)
        public string? Reason { get; set; }
    }
}
