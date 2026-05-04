using PlannerApp.Api.Models;

namespace PlannerApp.Api.DTOs;

public class UpdateTaskDto
{
    // Status fields (always present)
    public bool IsCompleted { get; set; }
    public string? Status { get; set; }

    // Edit fields (optional — only sent by EditTaskModal)
    public string? Title { get; set; }
    public string? Description { get; set; }
    public Guid? AssignedUserId { get; set; }
    public DateTime? DueDate { get; set; }
    public ReportingFrequency? ReminderFrequency { get; set; }
}
