//using Microsoft.AspNetCore.Mvc;
//using Railway.Core.Services;

//namespace Railway.Api.Controllers
//{
//    [ApiController]
//    [Route("api/ai")]
//    public class AiController : ControllerBase
//    {
//        [HttpPost("ask")]
//        public async Task<IActionResult> Ask([FromBody] AiRequest req)
//        {
//            var reply = await OllamaClient.AskAI(req.Question);
//            return Ok(new { reply });
//        }
//    }

//    public class AiRequest
//    {
//        public string Question { get; set; }
//    }
//}
