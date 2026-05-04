namespace PlannerApp.Api.Models;

public class UserSupervisor
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid SupervisorId { get; set; }
    public User Supervisor { get; set; } = null!;

    public ReportingFrequency Frequency { get; set; } = ReportingFrequency.Weekly;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
