using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlannerApp.Api.Data;
using PlannerApp.Api.Models;

namespace PlannerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context
            .Users.OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.StaffId,
                u.PhoneNumber,
                u.Position,
                u.CreatedAt,
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _context
            .Users.Where(u => u.Id == id)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.StaffId,
                u.PhoneNumber,
                u.Position,
                u.CreatedAt,
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound("User not found");

        return Ok(user);
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            // Verify current password
            if (
                string.IsNullOrEmpty(user.PasswordHash)
                || !BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash)
            )
            {
                return BadRequest(new { message = "Current password is incorrect" });
            }

            // Validate new password
            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "New password must be at least 6 characters" });
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in ChangePassword: {ex.Message}");
            return StatusCode(500, new { message = "Error changing password", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        try
        {
            // Optional: Prevent users from deleting themselves
            var currentUserId = GetCurrentUserId();
            if (currentUserId == id)
                return BadRequest(new { message = "Cannot delete your own account" });

            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            // Optional: Check if user has related data (plans, tasks, etc.)
            // If yes, either delete them or prevent deletion
            // var hasRelatedData = await _context.Plans.AnyAsync(p => p.UserId == id);
            // if (hasRelatedData)
            //     return BadRequest(new { message = "Cannot delete user with existing plans" });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in DeleteUser: {ex.Message}");
            return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
        }
    }

    [HttpGet("by-staffid/{staffId}")]
    public async Task<IActionResult> GetUserByStaffId(string staffId)
    {
        var user = await _context
            .Users.Where(u => u.StaffId == staffId)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.StaffId,
                u.PhoneNumber,
                u.Position,
                u.CreatedAt,
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound("User not found");

        return Ok(user);
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        if (claim == null)
            return null;
        return Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}
