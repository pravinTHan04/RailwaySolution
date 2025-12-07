using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Railway.Core.Models;

namespace Railway.Core.Data
{
    public class RailwayDbContext : IdentityDbContext<AppUser>
    {
        public RailwayDbContext(DbContextOptions<RailwayDbContext> options)
            : base(options) { }

        public DbSet<Train> Trains { get; set; }
        public DbSet<Carriage> Carriages { get; set; }
        public DbSet<Seat> Seats { get; set; }

        public DbSet<Station> Stations { get; set; }
        public DbSet<RailRoute> Routes { get; set; }
        public DbSet<RouteStop> RouteStops { get; set; }

        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<ScheduleStop> ScheduleStops { get; set; }

        public DbSet<Booking> Bookings { get; set; }
        public DbSet<ReservedSeat> ReservedSeats { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<UserAiContext> AiContexts { get; set; }
        public DbSet<Passenger> Passengers { get; set; }
        public DbSet<TrainType> TrainTypes { get; set; }
        public DbSet<UserPreference> UserPreferences { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<RouteStop>()
                .HasOne(rs => rs.Route)
                .WithMany(r => r.Stops)
                .HasForeignKey(rs => rs.RouteId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ScheduleStop>()
                .HasOne(ss => ss.Schedule)
                .WithMany(s => s.Stops)
                .HasForeignKey(ss => ss.ScheduleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ReservedSeat>()
                .HasOne(rs => rs.Seat)
                .WithMany()
                .HasForeignKey(rs => rs.SeatId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ReservedSeat>()
                .HasOne(rs => rs.Booking)
                .WithMany(b => b.ReservedSeats)
                .HasForeignKey(rs => rs.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ReservedSeat>()
                .HasIndex(r => new { r.SeatId, r.FromStopOrder, r.ToStopOrder });

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<TrainType>()
                .Ignore(t => t.Trains);


            modelBuilder.Entity<UserPreference>(entity =>
            {
                entity.HasKey(p => new { p.UserId, p.TrainType });
                entity.Property(p => p.UserId).IsRequired().HasMaxLength(200);
                entity.Property(p => p.TrainType).IsRequired().HasMaxLength(100);
            });

        }
    }
}
