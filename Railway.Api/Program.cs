using Microsoft.EntityFrameworkCore;
using Railway.Core.Data;
using Railway.Core.Services.Interfaces;
using Railway.Core.Services;

var builder = WebApplication.CreateBuilder(args);

// Add controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// DbContext
builder.Services.AddDbContext<RailwayDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("RailwayDB"));
});

// Dependency Injection for services
builder.Services.AddScoped<IBookingService, BookingService>();
//builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<ISeatAllocationService, SeatAllocationService>();
builder.Services.AddScoped<IBookingService, BookingService>();


var app = builder.Build();

// Swagger UI only in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Apply pending migrations automatically (optional but helpful for development)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RailwayDbContext>();
    db.Database.Migrate();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
