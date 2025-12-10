using System.Net.Http.Json;
using System.Text.Json;

namespace Railway.Core.Services
{
    public static class OllamaClient
    {
        private static readonly HttpClient _http = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:11434")
        };

        public static async Task<string> AskAI(string prompt)
        {
            var request = new
            {
                model = "llama3", 
                prompt = prompt,
                stream = false,
                options = new { temperature = 0 }
            };

            var response = await _http.PostAsJsonAsync("/api/generate", request);
            response.EnsureSuccessStatusCode();

            var result = JsonSerializer.Deserialize<OllamaResponse>(
                await response.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return result?.Response ?? "No response";
        }

        private class OllamaResponse
        {
            public string Response { get; set; }
        }
    }
}
