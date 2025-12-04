//using Microsoft.AspNetCore.Mvc;
//using Railway.Core.Models;
//using Railway.Core.Services;

//namespace Railway.Api.Controllers
//{
//    [ApiController]
//    [Route("api/schedules")]
//    public class SchedulesController : ControllerBase
//    {
//        [HttpPost("generate")]
//        public IActionResult Generate([FromBody] ScheduleRequest request)
//        {
//            if (request == null) return BadRequest("Invalid request");

//            var result = ScheduleService.GenerateSchedules(
//                request.Lines,
//                request.Trains,
//                request.StationDemand,
//                request.TimeDemand,
//                request.Crews
//            );

//            BookingService.SetSchedule(result);

//            return Ok(result);
//        }

//        [HttpGet]
//        public IActionResult GetSchedule()
//        {
//            return Ok(BookingService.GetSchedule());
//        }
//    }

//    public class ScheduleRequest
//    {
//        public List<LineConfig> Lines { get; set; }
//        public List<Train> Trains { get; set; }
//        public List<Crew> Crews { get; set; }
//        public List<StationDemand> StationDemand { get; set; }
//        public List<TimeDemand> TimeDemand { get; set; }
//    }
//}
