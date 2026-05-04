using PlannerApp.Api.Models;

public class CreateBoardDto
{
    public string Name { get; set; }
    public ReportingFrequency Frequency { get; set; }
    public Guid? SupervisorId { get; set; } // optional
    public List<Guid>? AssignedUserIds { get; set; } // optional
}
