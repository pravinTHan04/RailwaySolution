using Railway.Core.Models;

namespace Railway.Core.Services.Interfaces
{
    public interface IDelayPredictionService
    {
        // Takes a full Schedule (with Route + Train loaded)
        DelayPredictionResult PredictForSchedule(Schedule schedule);
    }
}
