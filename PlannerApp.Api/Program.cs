using System.Text;
using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PlannerApp.Api.Data;
using PlannerApp.Api.Hubs;
using PlannerApp.Api.Services;

var builder = WebApplication.CreateBuilder(args);
var jwtKey = builder.Configuration["JwtKey"]!;
var jwtIssuer = builder.Configuration["JwtIssuer"]!;
var jwtAudience = builder.Configuration["JwtAudience"]!;

// ------------------
// Database
// ------------------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);
builder.Services.AddSingleton<RateLimitService>();

// ------------------
// JWT Authentication - ONLY ONE REGISTRATION
// ------------------
builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero, // Optional: reduce token expiration tolerance
        };

        // Configure for SignalR - read token from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notifications"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
        };
    });

// ------------------
// CORS
// ------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReactApp",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",
                    "http://localhost:3001",
                    "http://192.168.56.1:3000",
                    "http://localhost:5108",
                    "http://192.168.0.105:3000",
                    "http://10.30.22.205:3001"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

builder.Services.AddAuthorization();

// ------------------
// Services
// ------------------
builder.Services.AddScoped<FirebaseService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddSignalR();
builder.Services.AddScoped<PdfGenerationService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// ------------------
// Controllers with JSON options
// ------------------
builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System
            .Text
            .Json
            .Serialization
            .ReferenceHandler
            .IgnoreCycles;
        options.JsonSerializerOptions.MaxDepth = 64;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// ------------------
// Hangfire
// ------------------
builder.Services.AddHangfire(config => config.UseMemoryStorage());
builder.Services.AddHangfireServer();

// ------------------
// Swagger
// ------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ------------------
// Build App
// ------------------
var app = builder.Build();
app.MapHub<NotificationHub>("/notifications");

// ------------------
// Middleware - ORDER IS CRITICAL!
// ------------------
app.UseSwagger();
app.UseSwaggerUI();

// CORS must be called before Authentication and Authorization
app.UseCors("AllowReactApp");

app.UseHttpsRedirection();

app.UseAuthentication(); // Add authentication
app.UseAuthorization(); // Add authorization

app.MapControllers();
app.UseHangfireDashboard();

// ------------------
// Recurring Jobs
// ------------------
RecurringJob.AddOrUpdate<NotificationService>(
    "send-notifications",
    service => service.SendScheduledNotifications(),
    Cron.Minutely
);

RecurringJob.AddOrUpdate<NotificationService>(
    "due-tomorrow",
    service => service.SendDueTomorrowNotifications(),
    Cron.Daily(8)
);

RecurringJob.AddOrUpdate<NotificationService>(
    "overdue-tasks",
    service => service.SendOverdueNotifications(),
    Cron.Hourly
);

// ------------------
// Run
// ------------------
app.Run();
