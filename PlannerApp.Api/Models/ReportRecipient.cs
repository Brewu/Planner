// Models/ReportRecipient.cs
using System;

namespace PlannerApp.Api.Models;

public class ReportRecipient
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Type { get; set; } = "TO"; // TO, CC, BCC
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation property
    public virtual User? User { get; set; }
}
