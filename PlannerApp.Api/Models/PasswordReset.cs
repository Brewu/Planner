using System;

namespace PlannerApp.Api.Models;

public class PasswordReset
{
    public int Id { get; set; }
    public string StaffId { get; set; }
    public string Email { get; set; }
    public string ResetCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
}
