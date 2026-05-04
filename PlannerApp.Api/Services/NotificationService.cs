using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PlannerApp.Api.Data;
using PlannerApp.Api.Hubs;
using PlannerApp.Api.Models;

namespace PlannerApp.Api.Services;

public class NotificationService
{
    private readonly AppDbContext _context;
    private readonly FirebaseService _firebase;
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationService(
        AppDbContext context,
        FirebaseService firebase,
        IHubContext<NotificationHub> hub
    )
    {
        _context = context;
        _firebase = firebase;
        _hub = hub;
    }

    // -----------------------------
    // Send a real-time / push notification immediately
    // -----------------------------
    public async Task SendImmediateNotification(
        Guid userId,
        string message,
        Guid? boardId = null,
        Guid? taskId = null
    )
    {
        string title = DetermineTitle(boardId, taskId);

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            BoardId = boardId,
            TaskId = taskId,
            ScheduledAt = DateTime.UtcNow,
            IsSent = false,
            CreatedAt = DateTime.UtcNow,
            Type = DetermineNotificationType(boardId, taskId),
            RelatedEntityId = boardId ?? taskId,
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Send real-time via SignalR
        await _hub
            .Clients.User(userId.ToString())
            .SendAsync(
                "ReceiveNotification",
                new
                {
                    notification.Id,
                    notification.Title,
                    notification.Message,
                    notification.Type,
                    notification.BoardId,
                    notification.TaskId,
                    notification.CreatedAt,
                    IsRead = false,
                }
            );

        // Send push notification via Firebase
        await SendPushIfSubscribed(userId, title, message);

        notification.IsSent = true;
        await _context.SaveChangesAsync();
    }

    // -----------------------------
    // Send a report notification with metadata
    // -----------------------------
    public async Task SendReportNotification(
        Guid userId,
        string message,
        string reportUrl,
        string reportName,
        Guid boardId
    )
    {
        var metadata = new Dictionary<string, string>
        {
            ["reportUrl"] = reportUrl,
            ["reportName"] = reportName,
            ["boardId"] = boardId.ToString(),
        };

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "📊 Board Report Ready",
            Message = message,
            BoardId = boardId,
            ScheduledAt = DateTime.UtcNow,
            IsSent = false,
            CreatedAt = DateTime.UtcNow,
            Type = "Report",
            RelatedEntityId = boardId,
            Metadata = metadata,
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Send real-time via SignalR
        await _hub
            .Clients.User(userId.ToString())
            .SendAsync(
                "ReceiveNotification",
                new
                {
                    notification.Id,
                    notification.Title,
                    notification.Message,
                    notification.Type,
                    notification.BoardId,
                    notification.CreatedAt,
                    IsRead = false,
                    Metadata = metadata,
                    Action = "view_report",
                }
            );

        // Send push notification via Firebase
        await SendPushIfSubscribed(userId, notification.Title, message);

        // FIX: Mark as sent (was missing before)
        notification.IsSent = true;
        await _context.SaveChangesAsync();
    }

    // -----------------------------
    // Schedule a notification for later delivery
    // -----------------------------
    public async Task ScheduleNotification(
        Guid userId,
        string message,
        ReportingFrequency frequency,
        Guid? boardId = null
    )
    {
        var scheduledTime = CalculateScheduledTime(frequency);

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = $"Scheduled {frequency} Report",
            Message = message,
            BoardId = boardId,
            ScheduledAt = scheduledTime,
            IsSent = false,
            CreatedAt = DateTime.UtcNow,
            Type = "Scheduled",
            RelatedEntityId = boardId,
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    // -----------------------------
    // Send all due scheduled notifications
    // -----------------------------
    public async Task SendScheduledNotifications()
    {
        var now = DateTime.UtcNow;

        var notifications = await _context
            .Notifications.Where(n => !n.IsSent && n.ScheduledAt <= now)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            // Send real-time via SignalR
            await _hub
                .Clients.User(notification.UserId.ToString())
                .SendAsync(
                    "ReceiveNotification",
                    new
                    {
                        notification.Id,
                        notification.Title,
                        notification.Message,
                        notification.Type,
                        notification.BoardId,
                        notification.TaskId,
                        notification.CreatedAt,
                        IsRead = notification.IsRead,
                    }
                );

            // FIX: Also send push for scheduled notifications
            await SendPushIfSubscribed(
                notification.UserId,
                notification.Title,
                notification.Message
            );

            notification.IsSent = true;
        }

        await _context.SaveChangesAsync();
    }

    // -----------------------------
    // Due-tomorrow reminders
    // -----------------------------
    public async Task SendDueTomorrowNotifications()
    {
        var tomorrow = DateTime.UtcNow.Date.AddDays(1);
        var tasks = await _context
            .Tasks.Where(t => t.DueDate.HasValue && t.DueDate.Value.Date == tomorrow)
            .Include(t => t.AssignedUser)
            .Include(t => t.Board)
            .ToListAsync();

        foreach (var task in tasks)
        {
            await SendImmediateNotification(
                task.AssignedUserId,
                $"Reminder: Task '{task.Title}' in board '{task.Board.Name}' is due tomorrow",
                task.BoardId,
                task.Id
            );
        }
    }

    // -----------------------------
    // Overdue reminders
    // -----------------------------
    public async Task SendOverdueNotifications()
    {
        var now = DateTime.UtcNow;
        var tasks = await _context
            .Tasks.Where(t => t.DueDate.HasValue && t.DueDate.Value < now && !t.IsCompleted)
            .Include(t => t.AssignedUser)
            .Include(t => t.Board)
            .ToListAsync();

        foreach (var task in tasks)
        {
            await SendImmediateNotification(
                task.AssignedUserId,
                $"⚠️ Overdue: Task '{task.Title}' in board '{task.Board.Name}' is overdue",
                task.BoardId,
                task.Id
            );
        }
    }

    // -----------------------------
    // Shared helpers
    // -----------------------------
    private async Task SendPushIfSubscribed(Guid userId, string title, string message)
    {
        var pushToken = await _context
            .PushSubscriptions.Where(p => p.UserId == userId)
            .Select(p => p.FcmToken)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrEmpty(pushToken))
        {
            await _firebase.SendPushNotificationAsync(pushToken, title, message);
        }
    }

    private static string DetermineTitle(Guid? boardId, Guid? taskId)
    {
        if (boardId.HasValue && taskId.HasValue)
            return "Task Assignment";
        if (boardId.HasValue)
            return "Board Update";
        return "System Notification";
    }

    private static string DetermineNotificationType(Guid? boardId, Guid? taskId)
    {
        if (boardId.HasValue && taskId.HasValue)
            return "TaskAssignment";
        if (boardId.HasValue)
            return "BoardUpdate";
        if (taskId.HasValue)
            return "TaskUpdate";
        return "System";
    }

    private static DateTime CalculateScheduledTime(ReportingFrequency frequency) =>
        frequency switch
        {
            ReportingFrequency.Weekly => DateTime.UtcNow.AddDays(7),
            ReportingFrequency.Monthly => DateTime.UtcNow.AddMonths(1),
            ReportingFrequency.Yearly => DateTime.UtcNow.AddYears(1),
            _ => DateTime.UtcNow.AddDays(7),
        };
}
