using Microsoft.AspNetCore.Mvc;
using Railway.Core.Services;
using Railway.Core.Services.Interfaces;
using System.Text.Json;

namespace Railway.Api.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class AiController : ControllerBase
    {
        private readonly IScheduleSearchService _searchService;
        private readonly IScheduleService _scheduleService;
        private readonly IAiContextService _contextService;
        private readonly IBookingService _bookingService;


        public AiController(IScheduleSearchService searchService, IScheduleService scheduleService, IAiContextService contextService, IBookingService bookingService)
        {
            _searchService = searchService;
            _scheduleService = scheduleService;
            _contextService = contextService;
            _bookingService = bookingService;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] AiRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Question))
                return BadRequest(new { error = "Question cannot be empty." });

            var userId = HttpContext.User.Identity?.Name ?? "guest";
            var previousIntent = await _contextService.LoadAsync(userId);


            var today = DateTime.Today;

            var prompt = $@"
You are an intelligent railway booking assistant.

Your ONLY job is to extract structured information from the user's message.
Return ONLY valid JSON. No extra text, no markdown, no explanations.

Use this JSON schema:

{{
  ""intent"": ""search_schedule"" | ""book"" | ""cancel"",
  ""from"": ""exact station name or null"",
  ""to"": ""exact station name or null"",
  ""date"": ""YYYY-MM-DD"" or null,
  ""time"": ""HH:mm"" or a word like ""morning""/""evening""/""night"" or null,
  ""trainType"": ""express"" | ""intercity"" | ""normal"" | null,
  ""seatCount"": number or null,
  ""passengerName"": string or null,
  ""email"": string or null,
  ""missing"": [ ""from"" | ""to"" | ""date"" | ""time"" | ""seatCount"" | ""passengerName"" | ""email"" ]
}}

Rules:

- Today's date is: {today:yyyy-MM-dd}
- Convert natural language dates:
  - ""today"" → ""{today:yyyy-MM-dd}""
  - ""tomorrow"" → ""{today.AddDays(1):yyyy-MM-dd}""
  - ""day after tomorrow"" → ""{today.AddDays(2):yyyy-MM-dd}""
  - ""in 2 days"" → today + 2 days
- If the user clearly wants to find or book a train, intent = ""book"".
- If user only asks about trains without clearly booking, use ""search_schedule"".
- If user asks to cancel a booking, intent = ""cancel"".

VERY IMPORTANT:
- If the user did NOT clearly say a field, set it to null and put its name in ""missing"".
- If the user provided the info, fill it and DO NOT put it in ""missing"".

User message: ""{req.Question}""
";



            // ---- Step 1: Ask Ollama ----
            var aiText = await OllamaClient.AskAI(prompt);

            // Cleanup AI formatting
            aiText = aiText.Trim()
                            .Replace("```json", "")
                            .Replace("```", "")
                            .Trim();

            AiIntent? intent;

            try
            {
                intent = JsonSerializer.Deserialize<AiIntent>(aiText,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        AllowTrailingCommas = true
                    });
            }
            catch
            {
                return BadRequest(new { error = "AI returned invalid JSON.", raw = aiText });
            }

            if (previousIntent != null)
            {
                if (string.IsNullOrWhiteSpace(intent.From))
                    intent.From = previousIntent.From;

                if (string.IsNullOrWhiteSpace(intent.To))
                    intent.To = previousIntent.To;

                if (string.IsNullOrWhiteSpace(intent.Date))
                    intent.Date = previousIntent.Date;
            }



            if (intent == null || string.IsNullOrWhiteSpace(intent.Intent))
                return BadRequest(new { error = "AI did not provide intent.", raw = aiText });


            // ---------- EXECUTE INTENT ----------
            switch (intent.Intent)
{
    case "search_schedule":
        return await HandleScheduleSearch(intent);

    case "book":
        return Ok(new
        {
            intent = "book",
            ai = "Which train would you like to book? Tap a train from the list."
        });

    case "cancel":
        return Ok(new
        {
            intent = "cancel",
            ai = "Sure — tell me your booking ID and I will cancel it."
        });

    default:
        return Ok(new
        {
            ai = "I understood your request, but I don't support that action yet.",
            intent
        });
}

        }


        // ---------- HANDLER FOR SEARCH ----------
        private async Task<IActionResult> HandleScheduleSearch(AiIntent intent)
        {
            // --- 1️⃣ Check missing pieces and respond properly ---
            if (string.IsNullOrWhiteSpace(intent.From))
                return Ok(new { ai = "Where are you traveling from?" });

            if (string.IsNullOrWhiteSpace(intent.To))
                return Ok(new { ai = "Where do you want to go?" });

            if (string.IsNullOrWhiteSpace(intent.Date))
                return Ok(new { ai = "When do you want to travel?" });

            // --- 2️⃣ Parse date safely ---
            if (!DateTime.TryParse(intent.Date, out var parsedDate))
                return Ok(new { ai = "I didn't understand the travel date. Can you repeat it as YYYY-MM-DD?" });

            // --- 3️⃣ Limit date range ---
            if (parsedDate > DateTime.Today.AddDays(3))
            {
                return Ok(new
                {
                    ai = "Schedules are only available for the next 3 days. Please provide a closer date."
                });
            }

            // --- 4️⃣ Ensure schedules exist for that day ---
            await _scheduleService.GenerateUpcomingSchedulesAsync(3);

            // --- 5️⃣ Station Lookup ---
            var fromStation = await _searchService.GetStationByNameAsync(intent.From);
            var toStation = await _searchService.GetStationByNameAsync(intent.To);

            if (fromStation == null)
                return Ok(new { ai = $"I couldn't find '{intent.From}'. Can you give the exact station name?" });

            if (toStation == null)
                return Ok(new { ai = $"I couldn't find '{intent.To}'. Can you specify the destination more clearly?" });

            // --- 6️⃣ Query schedules ---
            var schedules = await _searchService.SearchAsync(new()
            {
                FromStationId = fromStation.Id,
                ToStationId = toStation.Id,
                Date = parsedDate
            });

            // --- 7️⃣ Response ---
            if (!schedules.Any())
            {
                return Ok(new
                {
                    ai = $"No trains found from {intent.From} to {intent.To} on {parsedDate:yyyy-MM-dd}. Try another time or day."
                });
            }

            return Ok(new
            {
                ai = $"Found {schedules.Count} train(s) from {intent.From} to {intent.To} on {parsedDate:yyyy-MM-dd}.",
                schedules
            });
        }


    }


    // ---------- MODELS ----------
    public class AiIntent
    {
        public string Intent { get; set; }
        public string From { get; set; }
        public string To { get; set; }
        public string Date { get; set; }
    }

    public class AiRequest
    {
        public string Question { get; set; }
    }
}
