using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.Models;

namespace Railway.Api.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(RailwayDbContext db)
        {
            // 1️⃣ Ensure Train Types Exist First
            if (!await db.TrainTypes.AnyAsync())
            {
                db.TrainTypes.AddRange(
                    new TrainType { Id = "type-local", Name = "Local", FareMultiplier = 1.0m, SpeedFactor = 1.2m, StopsAtEveryStation = true },
                    new TrainType { Id = "type-luxury", Name = "Luxury", FareMultiplier = 2.0m, SpeedFactor = 1.0m, StopsAtEveryStation = true },
                    new TrainType { Id = "type-express", Name = "Express", FareMultiplier = 1.5m, SpeedFactor = 0.7m, StopsAtEveryStation = false }
                );
                await db.SaveChangesAsync();
            }

            // 2️⃣ Fix existing trains still using "basic"
            var orphanTrains = db.Trains.Where(t => t.TrainTypeId == null || t.TrainTypeId == "basic").ToList();
            if (orphanTrains.Any())
            {
                foreach (var t in orphanTrains)
                    t.TrainTypeId = "type-local";

                await db.SaveChangesAsync();
            }

            // 3️⃣ If stations + trains already exist, stop (seed already done)
            if (await db.Stations.AnyAsync() && await db.Trains.AnyAsync())
                return;

            // ⭐ --- Remaining Initial Seed Only Runs ONCE --- ⭐

            // 4️⃣ Create Stations
            var stations = new List<Station>
            {
                new Station { Name = "Central Station" },
                new Station { Name = "North Station" },
                new Station { Name = "East Station" }
            };

            db.Stations.AddRange(stations);
            await db.SaveChangesAsync();

            // 5️⃣ Create Route
            var route = new RailRoute { Name = "Route A" };
            db.Routes.Add(route);
            await db.SaveChangesAsync();

            db.RouteStops.AddRange(new[]
            {
                new RouteStop { Route = route, Station = stations[0], Order = 1, TravelTimeFromPrevious = TimeSpan.Zero },
                new RouteStop { Route = route, Station = stations[1], Order = 2, TravelTimeFromPrevious = TimeSpan.FromMinutes(12) },
                new RouteStop { Route = route, Station = stations[2], Order = 3, TravelTimeFromPrevious = TimeSpan.FromMinutes(15) }
            });

            await db.SaveChangesAsync();

            // 6️⃣ Add Default Train
            var expressType = await db.TrainTypes.FirstAsync(t => t.Id == "type-express");

            var train = new Train { Name = "Express Line 1", TrainTypeId = expressType.Id };
            db.Trains.Add(train);
            await db.SaveChangesAsync();

            // 7️⃣ Add Carriage + Seats
            var carriage = new Carriage { Train = train, Index = 1 };
            db.Carriages.Add(carriage);
            await db.SaveChangesAsync();

            db.Seats.AddRange(
                Enumerable.Range(1, 20).Select(i => new Seat
                {
                    Carriage = carriage,
                    SeatNumber = $"A{i}"
                })
            );
            await db.SaveChangesAsync();

            // 8️⃣ Create Schedule
            var schedule = new Schedule
            {
                Train = train,
                Route = route,
                DepartureTime = DateTime.UtcNow.AddHours(1)
            };
            db.Schedules.Add(schedule);
            await db.SaveChangesAsync();

            // 9️⃣ Generate Stop Times
            DateTime cursor = schedule.DepartureTime;

            foreach (var stop in db.RouteStops.OrderBy(s => s.Order))
            {
                var arrival = cursor;
                var departure = stop.Order == 1 ? cursor : cursor.AddMinutes(2);

                db.ScheduleStops.Add(new ScheduleStop
                {
                    Schedule = schedule,
                    Station = stop.Station,
                    Arrival = arrival,
                    Departure = departure,
                    Order = stop.Order
                });

                cursor = departure.Add(stop.TravelTimeFromPrevious);
            }

            await db.SaveChangesAsync();
        }
    }
}
