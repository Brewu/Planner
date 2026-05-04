// DTOs/SupervisorRequestDtos.cs
namespace PlannerApp.Api.DTOs;

using PlannerApp.Api.Models; // 👈 add this

public class SendSupervisorRequestDto
{
    public Guid RequesterId { get; set; }
    public Guid SupervisorId { get; set; }
    public string Frequency { get; set; } = "Weekly"; // accept string, parse in controller
}

public class RespondToRequestDto
{
    public Guid RequestId { get; set; }
    public bool Accept { get; set; }
}
