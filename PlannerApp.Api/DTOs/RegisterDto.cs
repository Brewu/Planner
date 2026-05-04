namespace PlannerApp.Api.DTOs;

public class RegisterDto
{
    public required string Name { get; set; }
    public required string Email { get; set; } // required now
    public required string Password { get; set; } // required now
    public string? PhoneNumber { get; set; } // still optional
}
