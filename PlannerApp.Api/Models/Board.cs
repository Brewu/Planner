namespace PlannerApp.Api.Models;

public class Board
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public ReportingFrequency Frequency { get; set; }

    // Completed when all tasks are done
    public bool IsCompleted { get; set; } = false;

    // Supervisor relationship
    public Guid? SupervisorId { get; set; }
    public User? Supervisor { get; set; }

    // Assigned Users
    public List<User> AssignedUsers { get; set; } = new();

    public List<TaskItem> Tasks { get; set; } = new();
}
