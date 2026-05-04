namespace PlannerApp.Api.DTOs;

public class PasswordResetRequestDto
{
    public string StaffId { get; set; }
    public string Email { get; set; }
}

public class VerifyResetCodeDto
{
    public string StaffId { get; set; }
    public string Code { get; set; }
}

public class ResetPasswordDto
{
    public string StaffId { get; set; }
    public string Code { get; set; }
    public string NewPassword { get; set; }
}
