// Models/SupervisorRequest.cs
namespace PlannerApp.Api.Models;

public enum RequestStatus
{
    Pending,
    Accepted,
    Declined,
}

public class SupervisorRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RequesterId { get; set; } // the user who wants a supervisor
    public User Requester { get; set; } = null!;

    public Guid SupervisorId { get; set; } // the proposed supervisor
    public User Supervisor { get; set; } = null!;

    public ReportingFrequency Frequency { get; set; }

    public RequestStatus Status { get; set; } = RequestStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
    public bool InitiatedBySupervisor { get; set; } = false;
}
