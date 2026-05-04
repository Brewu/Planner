using System.ComponentModel.DataAnnotations;

namespace PlannerApp.Api.Models;

public class TaskItem
{
    public Guid Id { get; set; }

    [Required]
    public string Title { get; set; }
    public string? Description { get; set; }

    public Guid BoardId { get; set; }
    public Board Board { get; set; }

    // Who is responsible
    public Guid AssignedUserId { get; set; }
    public User AssignedUser { get; set; }

    public bool IsCompleted { get; set; } = false;

    // "pending" | "in-progress" | "completed"
    public string Status { get; set; } = "pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // -----------------------------
    // Reminders
    // -----------------------------
    public DateTime? DueDate { get; set; }
    public ReportingFrequency? ReminderFrequency { get; set; }
}
