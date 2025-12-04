//using Railway.Core.Services;
//using Railway.Core.Models;
//using System.Text.Json;

//namespace RailwayScheduler
//{
//    class Program
//    {
//        static async Task Main(string[] args)
//        {
//            Console.WriteLine("Smart Railway Scheduling Optimizer - Rule-based (Console)");

//            var lines = await LoadJson<List<LineConfig>>("lines.json");
//            var trains = await LoadJson<List<Train>>("trains.json");
//            var crews = await LoadJson<List<Crew>>("crew.json");
//            var stationDemand = await LoadJson<List<StationDemand>>("station_demand.json");
//            var timeDemand = await LoadJson<List<TimeDemand>>("time_demand.json");

//            if (stationDemand == null)
//            {
//                Console.WriteLine("Missing station_demand.json (required).");
//                return;
//            }
//            if (lines == null || trains == null || trains.Count == 0)
//            {
//                Console.WriteLine("Missing or invalid lines.json / trains.json.");
//                return;
//            }

//            //Generate schedule
//            var departures = ScheduleService.GenerateSchedules(lines, trains, stationDemand, timeDemand, crews);
//            Console.WriteLine($"\nGenerated {departures.Count} trips.\n");

//            //Print and Save outputs
//            ReportingService.PrintScheduleTable(departures);
//            ReportingService.SaveScheduleCsv(departures, "schedule_output.csv");
//            Console.WriteLine("CSV exported to schedule_output.csv");

//            GanttService.GenerateGanttChart(departures, "schedule_chart.png");
//            Console.WriteLine("Gantt chart saved to schedule_chart.png");

//            //Save JSON
//            File.WriteAllText("schedules.json", JsonSerializer.Serialize(departures, new JsonSerializerOptions
//            {
//                WriteIndented = true
//            }));
//            Console.WriteLine("Schedule saved to schedules.json");

//                        foreach (var d in departures.Take(10))
//            {
//                Console.WriteLine($"{d.DepartureTime:HH:mm} | Train {d.TrainId} | Crew {d.CrewId} | {d.LineName}");
//            }
//        }

//        static async Task<T> LoadJson<T>(string filename)
//        {
//            var path = Path.Combine(AppContext.BaseDirectory, filename);
//            if (!File.Exists(path))
//                return default;

//            var json = await File.ReadAllTextAsync(path);
//            return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions
//            {
//                PropertyNameCaseInsensitive = true
//            });
//        }
//    }
//}
