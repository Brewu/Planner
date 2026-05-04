namespace PlannerApp.Api.DTOs;

public class UpdateProfileDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Position { get; set; }
}
