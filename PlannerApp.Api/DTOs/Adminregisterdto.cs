namespace PlannerApp.Api.DTOs;

public class AdminRegisterDto
{
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string StaffId { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Position { get; set; }
}
