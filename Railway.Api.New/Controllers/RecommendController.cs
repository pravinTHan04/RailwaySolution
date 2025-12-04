//using Microsoft.AspNetCore.Mvc;
//using Railway.Core.Services;

//namespace Railway.Api.Controllers
//{
//    [ApiController]
//    [Route("api/recommend")]
//    public class RecommendController : ControllerBase
//    {
//        [HttpGet]
//        public IActionResult Recommend(string from, string to, string time)
//        {
//            var schedule = BookingService.GetSchedule();
//            if (schedule == null || schedule.Count == 0)
//                return NotFound("No schedule generated.");

//            if (!TimeSpan.TryParse(time, out var requestedTime))
//                return BadRequest("Invalid time format. Use HH:mm.");

//            var results = schedule
//                .Where(s =>
//                    s.Stops.Any(x => x.Station == from) &&
//                    s.Stops.Any(x => x.Station == to) &&
//                    s.DepartureTime.TimeOfDay >= requestedTime &&
//                    s.Stops.FindIndex(x => x.Station == from) <
//                    s.Stops.FindIndex(x => x.Station == to)
//                )
//                .OrderBy(s => s.DepartureTime)
//                .Take(3) 
//                .ToList();

//            return Ok(results);
//        }
//    }
//}
