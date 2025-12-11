namespace Railway.Core.Models
{
    public class DelayPredictionResult
    {
        public bool IsDelayed { get; set; }

        public int ExpectedDelayMinutes { get; set; }

        public double Confidence { get; set; }

        public string? Reason { get; set; }
    }
}
