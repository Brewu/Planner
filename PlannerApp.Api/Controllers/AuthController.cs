using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AspNetCoreRateLimit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PlannerApp.Api.Data;
using PlannerApp.Api.DTOs;
using PlannerApp.Api.Models;
using PlannerApp.Api.Services;

namespace PlannerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;

    public AuthController(AppDbContext context, IConfiguration config, IEmailService emailService)
    {
        _context = context;
        _config = config;
        _emailService = emailService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.StaffId))
            return BadRequest("Staff ID is required.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.StaffId == dto.StaffId.Trim());

        if (
            user == null
            || user.PasswordHash == null
            || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)
        )
            return Unauthorized("Invalid staff ID or password.");

        var token = GenerateJwtToken(user);
        return Ok(new { token });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return Unauthorized();

        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        var isAdmin = User.IsInRole("Admin");

        return Ok(
            new
            {
                authenticated = true,
                isAdmin = isAdmin,
                claims = claims,
                userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                userName = User.FindFirst(ClaimTypes.Name)?.Value,
                userEmail = User.FindFirst(ClaimTypes.Email)?.Value,
                staffId = User.FindFirst("StaffId")?.Value,
                position = user.Position, // Add position/rank from database
                rank = user.Position, // Add rank alias for clarity
            }
        );
    }

    [HttpGet("setup-admin")]
    [AllowAnonymous]
    public async Task<IActionResult> SetupAdmin()
    {
        var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.StaffId == "ADMIN001");

        if (existingAdmin != null)
        {
            _context.Users.Remove(existingAdmin);
            await _context.SaveChangesAsync();
        }

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Name = "System Administrator",
            StaffId = "ADMIN001",
            Email = "admin@plannerapp.com",
            Position = "System Administrator",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            CreatedAt = DateTime.UtcNow,
            IsAdmin = true,
        };

        _context.Users.Add(adminUser);
        await _context.SaveChangesAsync();

        return Ok(
            new
            {
                message = "Admin user created successfully",
                staffId = "ADMIN001",
                password = "Admin@123",
            }
        );
    }

    [HttpPost("register")]
    [AllowAnonymous] // Temporarily allow anyone to register for testing
    public async Task<IActionResult> Register([FromBody] AdminRegisterDto dto)
    {
        try
        {
            Console.WriteLine("=== REGISTER REQUEST RECEIVED ===");
            Console.WriteLine($"Name: {dto.Name}");
            Console.WriteLine($"Email: {dto.Email}");
            Console.WriteLine($"StaffId: {dto.StaffId}");
            Console.WriteLine($"Position: {dto.Position}");

            // Validate input
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "Email is required." });

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Name is required." });

            // Auto-generate Staff ID if not provided
            if (string.IsNullOrWhiteSpace(dto.StaffId))
            {
                var lastUser = await _context
                    .Users.OrderByDescending(u => u.CreatedAt)
                    .FirstOrDefaultAsync();

                int lastId = 0;
                if (lastUser?.StaffId != null && lastUser.StaffId.StartsWith("STAFF"))
                {
                    int.TryParse(lastUser.StaffId.Substring(5), out lastId);
                }
                dto.StaffId = $"STAFF{(lastId + 1).ToString("D3")}";
                Console.WriteLine($"Auto-generated Staff ID: {dto.StaffId}");
            }

            // Check if user already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email == dto.Email || u.StaffId == dto.StaffId
            );

            if (existingUser != null)
                return Conflict(
                    new { message = "User with this email or staff ID already exists." }
                );

            // Generate random password
            var randomPassword = GenerateRandomPassword();
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(randomPassword);

            Console.WriteLine($"Generated password for {dto.Email}: {randomPassword}");

            // Create new user
            var newUser = new User
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Email = dto.Email,
                StaffId = dto.StaffId,
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = hashedPassword,
                Position = dto.Position ?? "Staff", // Default to "Staff" if not provided
                CreatedAt = DateTime.UtcNow,
                IsAdmin = false,
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            Console.WriteLine($"User created successfully with ID: {newUser.Id}");

            // Send email with credentials
            try
            {
                await _emailService.SendRegistrationEmailAsync(
                    dto.Email,
                    dto.Name,
                    dto.StaffId,
                    randomPassword
                );
                Console.WriteLine($"Email sent to {dto.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending failed: {ex.Message}");
                // Don't fail the registration if email fails
            }

            return Ok(
                new
                {
                    message = "User registered successfully. Credentials sent to their email.",
                    user = new
                    {
                        newUser.Id,
                        newUser.Name,
                        newUser.Email,
                        newUser.StaffId,
                        newUser.Position, // Include position in response
                    },
                }
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Registration error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { message = $"Registration failed: {ex.Message}" });
        }
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        if (claim == null)
            return null;
        return Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized();

            // Check if current user is admin
            var currentUser = await _context.Users.FindAsync(currentUserId);
            if (currentUser == null || !currentUser.IsAdmin)
            {
                return Forbid("Only admins can delete users");
            }

            // Don't allow deleting yourself
            if (currentUserId == id)
            {
                return BadRequest(new { message = "You cannot delete your own account" });
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound("User not found");

            // Check if user is admin - prevent deleting other admins
            if (user.IsAdmin)
            {
                return BadRequest(new { message = "Cannot delete admin users" });
            }

            // Remove related records (supervisor relationships, notifications, etc.)
            var userSupervisors = _context.UserSupervisors.Where(us =>
                us.UserId == id || us.SupervisorId == id
            );
            _context.UserSupervisors.RemoveRange(userSupervisors);

            var notifications = _context.Notifications.Where(n => n.UserId == id);
            _context.Notifications.RemoveRange(notifications);

            var pushSubscriptions = _context.PushSubscriptions.Where(ps => ps.UserId == id);
            _context.PushSubscriptions.RemoveRange(pushSubscriptions);

            var supervisorRequests = _context.SupervisorRequests.Where(sr =>
                sr.RequesterId == id || sr.SupervisorId == id
            );
            _context.SupervisorRequests.RemoveRange(supervisorRequests);

            // Update boards where this user is supervisor to remove reference
            var boards = _context.Boards.Where(b => b.SupervisorId == id);
            foreach (var board in boards)
            {
                board.SupervisorId = null;
            }

            // Finally delete the user
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"User {user.Name} deleted successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in DeleteUser: {ex.Message}");
            return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
        }
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] PasswordResetRequestDto dto)
    {
        try
        {
            Console.WriteLine($"=== PASSWORD RESET REQUEST ===");
            Console.WriteLine($"StaffId: {dto.StaffId}, Email: {dto.Email}");

            // Validate input
            if (string.IsNullOrWhiteSpace(dto.StaffId) || string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Staff ID and email are required." });
            }

            // IMPORTANT: Verify that the staff ID and email match exactly
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.StaffId == dto.StaffId.Trim() && u.Email == dto.Email.Trim()
            );

            if (user == null)
            {
                // For security, don't reveal whether the staff ID or email is incorrect
                Console.WriteLine(
                    $"No matching user found for StaffId: {dto.StaffId}, Email: {dto.Email}"
                );
                return BadRequest(
                    new
                    {
                        message = "Invalid staff ID or email combination. Please check your credentials.",
                    }
                );
            }

            // If we get here, the staff ID and email match!
            Console.WriteLine(
                $"User verified: {user.Name} ({user.Email}) - Staff ID: {user.StaffId}"
            );

            // Generate 6-digit reset code
            var random = new Random();
            var resetCode = random.Next(100000, 999999).ToString();

            // Delete any existing unused reset codes for this user
            var existingResets = await _context
                .PasswordResets.Where(r => r.StaffId == dto.StaffId && !r.IsUsed)
                .ToListAsync();

            if (existingResets.Any())
            {
                _context.PasswordResets.RemoveRange(existingResets);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Removed {existingResets.Count} existing reset codes");
            }

            // Create new reset record
            var passwordReset = new PasswordReset
            {
                StaffId = dto.StaffId.Trim(),
                Email = dto.Email.Trim(),
                ResetCode = resetCode,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                IsUsed = false,
            };

            _context.PasswordResets.Add(passwordReset);
            await _context.SaveChangesAsync();
            Console.WriteLine($"Saved reset code to database for {user.Email}");

            // Send email with reset code
            try
            {
                await _emailService.SendPasswordResetCodeAsync(user.Email, user.Name, resetCode);
                Console.WriteLine($"Reset code email sent to {user.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send reset email: {ex.Message}");
                // For development, you might want to return the code in the response
                // return Ok(new { message = "Reset code generated", resetCode = resetCode, email = user.Email });
            }

            return Ok(
                new { message = "A password reset code has been sent to your email address." }
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Forgot password error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { message = "An error occurred. Please try again later." });
        }
    }

    [HttpPost("verify-reset-code")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.StaffId) || string.IsNullOrWhiteSpace(dto.Code))
            {
                return BadRequest(new { message = "Staff ID and reset code are required." });
            }

            var resetRecord = await _context.PasswordResets.FirstOrDefaultAsync(r =>
                r.StaffId == dto.StaffId.Trim()
                && r.ResetCode == dto.Code
                && !r.IsUsed
                && r.ExpiresAt > DateTime.UtcNow
            );

            if (resetRecord == null)
            {
                return BadRequest(new { message = "Invalid or expired reset code." });
            }

            return Ok(new { message = "Code verified successfully." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Verify code error: {ex.Message}");
            return StatusCode(500, new { message = "An error occurred. Please try again." });
        }
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            // Validate input
            if (
                string.IsNullOrWhiteSpace(dto.StaffId)
                || string.IsNullOrWhiteSpace(dto.Code)
                || string.IsNullOrWhiteSpace(dto.NewPassword)
            )
            {
                return BadRequest(new { message = "All fields are required." });
            }

            if (dto.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters long." });
            }

            // Find valid reset record
            var resetRecord = await _context.PasswordResets.FirstOrDefaultAsync(r =>
                r.StaffId == dto.StaffId.Trim()
                && r.ResetCode == dto.Code
                && !r.IsUsed
                && r.ExpiresAt > DateTime.UtcNow
            );

            if (resetRecord == null)
            {
                return BadRequest(new { message = "Invalid or expired reset code." });
            }

            // Find user
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.StaffId == dto.StaffId.Trim()
            );
            if (user == null)
            {
                return BadRequest(new { message = "User not found." });
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            // Mark reset code as used
            resetRecord.IsUsed = true;

            await _context.SaveChangesAsync();

            // Send confirmation email
            try
            {
                await _emailService.SendPasswordResetConfirmationAsync(user.Email, user.Name);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send confirmation email: {ex.Message}");
            }

            return Ok(new { message = "Password has been reset successfully." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Reset password error: {ex.Message}");
            return StatusCode(500, new { message = "An error occurred. Please try again." });
        }
    }

    [HttpPost("register/bulk")]
    [AllowAnonymous] // Temporarily allow for testing
    public async Task<IActionResult> RegisterBulk([FromBody] AdminRegisterDto[] dtos)
    {
        if (dtos == null || dtos.Length == 0)
            return BadRequest("At least one user must be provided.");

        var results = new List<object>();
        var errors = new List<object>();

        foreach (var dto in dtos)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Name))
                {
                    errors.Add(new { email = dto.Email, error = "Name and email are required." });
                    continue;
                }

                if (string.IsNullOrWhiteSpace(dto.StaffId))
                {
                    var lastUser = await _context
                        .Users.OrderByDescending(u => u.CreatedAt)
                        .FirstOrDefaultAsync();
                    int lastId = 0;
                    if (lastUser?.StaffId != null && lastUser.StaffId.StartsWith("STAFF"))
                    {
                        int.TryParse(lastUser.StaffId.Substring(5), out lastId);
                    }
                    dto.StaffId = $"STAFF{(lastId + 1).ToString("D3")}";
                }

                var existingUser = await _context.Users.FirstOrDefaultAsync(u =>
                    u.Email == dto.Email || u.StaffId == dto.StaffId
                );

                if (existingUser != null)
                {
                    errors.Add(new { email = dto.Email, error = "User already exists." });
                    continue;
                }

                var randomPassword = GenerateRandomPassword();
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(randomPassword);

                var newUser = new User
                {
                    Id = Guid.NewGuid(),
                    Name = dto.Name,
                    Email = dto.Email,
                    StaffId = dto.StaffId,
                    PhoneNumber = dto.PhoneNumber,
                    Position = dto.Position ?? "Staff",
                    PasswordHash = hashedPassword,
                    CreatedAt = DateTime.UtcNow,
                    IsAdmin = false,
                };

                _context.Users.Add(newUser);

                try
                {
                    await _emailService.SendRegistrationEmailAsync(
                        dto.Email,
                        dto.Name,
                        dto.StaffId,
                        randomPassword
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Email sending failed for {dto.Email}: {ex.Message}");
                }

                results.Add(
                    new
                    {
                        email = dto.Email,
                        name = dto.Name,
                        staffId = dto.StaffId,
                        position = newUser.Position,
                        status = "success",
                    }
                );
            }
            catch (Exception ex)
            {
                errors.Add(new { email = dto.Email, error = ex.Message });
            }
        }

        await _context.SaveChangesAsync();

        return Ok(
            new
            {
                message = $"Processed {results.Count} users. {errors.Count} errors.",
                successful = results,
                failed = errors,
            }
        );
    }

    private string GenerateRandomPassword()
    {
        const string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string lowercase = "abcdefghijklmnopqrstuvwxyz";
        const string digits = "0123456789";
        const string special = "!@#$%^&*";

        var random = new Random();
        var password = new StringBuilder();

        password.Append(uppercase[random.Next(uppercase.Length)]);
        password.Append(lowercase[random.Next(lowercase.Length)]);
        password.Append(digits[random.Next(digits.Length)]);
        password.Append(special[random.Next(special.Length)]);

        var all = uppercase + lowercase + digits + special;
        for (int i = 0; i < 8; i++)
        {
            password.Append(all[random.Next(all.Length)]);
        }

        var shuffled = password.ToString().OrderBy(x => random.Next()).ToArray();
        return new string(shuffled);
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim("StaffId", user.StaffId ?? ""),
            new Claim("Position", user.Position ?? "Staff"), // Add position to JWT
            new Claim("Rank", user.Position ?? "Staff"), // Add rank alias
        };

        // Force admin for ADMIN001
        if (user.StaffId == "ADMIN001" || user.IsAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        }

        var token = new JwtSecurityToken(
            issuer: _config["JwtIssuer"],
            audience: _config["JwtAudience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
