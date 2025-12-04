using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Railway.Api.Data;
using Railway.Api.Identity;
using Railway.Core.Data;
using Railway.Core.Models;
using Railway.Core.Services;
using Railway.Core.Services.Interfaces;
using Railway.Core.Services.Routes;
using Railway.Core.Services.Stations;
using Railway.Core.Services.Trains;
using System.Security.Claims;
using System.Text;



var builder = WebApplication.CreateBuilder(args);

// Controllers + JSON fix for circular references
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });




// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Railway API", Version = "v1" });

    // Enable JWT auth in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        Description = "Enter: Bearer {your token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// DbContext (migrations stored in API)
builder.Services.AddDbContext<RailwayDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("RailwayDB"),
        b => b.MigrationsAssembly("Railway.Api")
    ));

// Dependency Injection
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<ISeatAllocationService, SeatAllocationService>();
builder.Services.AddScoped<IStationService, StationService>();
builder.Services.AddScoped<ITrainService, TrainService>();
builder.Services.AddScoped<IRouteService, RouteService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ITicketValidationService, TicketValidationService>();
builder.Services.AddScoped<IScheduleSearchService, ScheduleSearchService>();
builder.Services.AddScoped<IAiContextService, AiContextService>();
builder.Services.AddHttpContextAccessor();





// Identity
builder.Services.AddIdentity<AppUser, IdentityRole>()
    .AddEntityFrameworkStores<RailwayDbContext>()
    .AddDefaultTokenProviders();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "JwtBearer";
    options.DefaultChallengeScheme = "JwtBearer";
})
.AddJwtBearer("JwtBearer", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        RoleClaimType = ClaimTypes.Role
    };
});


var app = builder.Build();

// Swagger UI only in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RailwayDbContext>();
    var seatService = scope.ServiceProvider.GetRequiredService<ISeatAllocationService>();

    var trains = await db.Trains.ToListAsync();

    foreach (var train in trains)
    {
        await seatService.GenerateCarriagesForTrainAsync(train.Id);
        await seatService.GenerateSeatsForTrainAsync(train.Id);
    }
}


// Auto apply migrations + seed data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RailwayDbContext>();
    db.Database.Migrate();
    await SeedData.InitializeAsync(db);
}


using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RailwayDbContext>();
    db.Database.Migrate();

    await SeedAdmin.RunAsync(scope.ServiceProvider);
}

using (var scope = app.Services.CreateScope())
{
    var scheduleService = scope.ServiceProvider.GetRequiredService<IScheduleService>();
    await scheduleService.GenerateUpcomingSchedulesAsync(3);
}




app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
