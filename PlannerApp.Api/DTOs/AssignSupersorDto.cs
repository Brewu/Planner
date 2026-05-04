using PlannerApp.Api.Models; // For ReportingFrequency

public class AssignSupervisorDto
{
    public Guid UserId { get; set; } // The user who will report
    public Guid SupervisorId { get; set; } // The selected supervisor
    public ReportingFrequency Frequency { get; set; } // Weekly, Monthly, Yearly
}
