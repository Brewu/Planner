using PlannerApp.Api.Models;

// DTOs/CreateTaskDto.cs
public class CreateTaskDto
{
    public string Title { get; set; }
    public string? Description { get; set; }
    public Guid BoardId { get; set; }
    public Guid AssignedUserId { get; set; }

    public DateTime? DueDate { get; set; }
    public ReportingFrequency? ReminderFrequency { get; set; }
}
