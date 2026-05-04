using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlannerApp.Api.Data;
using PlannerApp.Api.Models;

namespace PlannerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotificationsController(AppDbContext context)
    {
        _context = context;
    }

    // Fetch all notifications for a user
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetNotifications(Guid userId)
    {
        var notifications = await _context
            .Notifications.Where(n => n.UserId == userId)
            .OrderByDescending(n => n.ScheduledAt)
            .ToListAsync();

        return Ok(notifications);
    }

    // Mark a single notification as read
    [HttpPut("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);

        if (notification == null)
            return NotFound("Notification not found");

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification marked as read" });
    }

    // Mark all notifications for a user as read
    [HttpPut("user/{userId}/read-all")]
    public async Task<IActionResult> MarkAllAsRead(Guid userId)
    {
        var notifications = await _context
            .Notifications.Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"All {notifications.Count} notifications marked as read" });
    }

    // Delete all notifications for a user
    [HttpDelete("user/{userId}")]
    public async Task<IActionResult> ClearAllNotifications(Guid userId)
    {
        var notifications = await _context
            .Notifications.Where(n => n.UserId == userId)
            .ToListAsync();

        _context.Notifications.RemoveRange(notifications);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"All {notifications.Count} notifications cleared" });
    }

    // Delete a single notification
    [HttpDelete("{notificationId}")]
    public async Task<IActionResult> DeleteNotification(Guid notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);

        if (notification == null)
            return NotFound("Notification not found");

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification deleted" });
    }

    // Register push subscription
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] PushSubscription subscription)
    {
        _context.PushSubscriptions.Add(subscription);
        await _context.SaveChangesAsync();
        return Ok();
    }
}
