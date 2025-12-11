using Railway.Core.Models;
using Railway.Core.Services.Interfaces;
using System;
using System.Collections.Generic;

namespace Railway.Core.Services
{
    public class DelayPredictionService : IDelayPredictionService
    {
        public DelayPredictionResult PredictForSchedule(Schedule schedule)
        {
            if (schedule == null || schedule.Train == null || schedule.Route == null)
            {
                return new DelayPredictionResult
                {
                    IsDelayed = false,
                    ExpectedDelayMinutes = 0,
                    Confidence = 0.2,
                    Reason = "Incomplete schedule data."
                };
            }

            var trainType = schedule.Train.TrainType?.Name ?? "Unknown";
            var stopCount = schedule.Route.Stops.Count;
            var hour = schedule.DepartureTime.Hour;
            var routeName = schedule.Route.Name ?? "";

            int delayMinutes = 0;
            double confidence = 0.15; // base low delay risk
            var reasons = new List<string>();


            if (hour >= 7 && hour <= 9)
            {
                confidence += 0.35;
                delayMinutes += 8;
                reasons.Add("Morning peak congestion.");
            }
            else if (hour >= 17 && hour <= 19)
            {
                confidence += 0.30;
                delayMinutes += 6;
                reasons.Add("Evening peak congestion.");
            }
            else if (hour >= 22 || hour <= 5)
            {
                confidence += 0.10;
                delayMinutes += 3;
                reasons.Add("Night operations may cause slowdowns.");
            }
            else
            {
                confidence += 0.05;
                delayMinutes += 1;
                reasons.Add("Off-peak hours – lower congestion.");
            }

     
            if (trainType.Equals("Local", StringComparison.OrdinalIgnoreCase))
            {
                confidence += 0.25;
                delayMinutes += 5;
                reasons.Add("Local train with many stops increases delay risk.");
            }
            else if (trainType.Equals("Express", StringComparison.OrdinalIgnoreCase))
            {
                confidence += 0.10;
                delayMinutes += 3;
                reasons.Add("Express train may get delayed due to track congestion.");
            }
            else if (trainType.Equals("Luxury", StringComparison.OrdinalIgnoreCase))
            {
                confidence -= 0.20;
                delayMinutes -= 4;
                reasons.Add("Luxury service is prioritized – usually more punctual.");
            }


            if (stopCount >= 8)
            {
                confidence += 0.20;
                delayMinutes += 6;
                reasons.Add("Long route with many stops.");
            }
            else if (stopCount >= 5)
            {
                confidence += 0.10;
                delayMinutes += 3;
                reasons.Add("Medium route length.");
            }


            if (routeName.Contains("Southern", StringComparison.OrdinalIgnoreCase))
            {
                confidence += 0.05;
                delayMinutes += 2;
                reasons.Add("Southern Line occasionally faces congestion.");
            }


            if (delayMinutes < 0) delayMinutes = 0;
            if (confidence < 0) confidence = 0;
            if (confidence > 1) confidence = 1;

 
            bool isDelayed = confidence >= 0.5 && delayMinutes >= 5;

            return new DelayPredictionResult
            {
                IsDelayed = isDelayed,
                ExpectedDelayMinutes = delayMinutes,
                Confidence = confidence,
                Reason = string.Join(" ", reasons)
            };
        }
    }
}
