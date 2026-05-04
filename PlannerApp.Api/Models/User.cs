namespace PlannerApp.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? StaffId { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? GoogleId { get; set; }
    public string? PasswordHash { get; set; }
    public string? Position { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── replaced single SupervisorId with many-to-many ──
    public ICollection<UserSupervisor> MySupervisors { get; set; } = new List<UserSupervisor>();
    public ICollection<UserSupervisor> MySupervisees { get; set; } = new List<UserSupervisor>();

    // keep for boards (board still has one supervisor)
    public Guid? SupervisorId { get; set; }
    public virtual User? Supervisor { get; set; }

    public ReportingFrequency? ReportingFrequency { get; set; }
    public ICollection<Board> Boards { get; set; } = new List<Board>();
    public bool IsAdmin { get; set; } = false; // ADD THIS

}
